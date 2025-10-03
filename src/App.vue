<script>
import Semester from './Semester.vue';
import SearchBar from './SearchBar.vue';
import SemesterButtons from './SemesterButtons.vue';
import Papa from 'papaparse';
import {max, min} from 'lodash';

export default {
  components: {
    Semester,
    SearchBar,
    SemesterButtons,
  },
  data() {
    return {
      tables: [],
      seasons: [], // Season (winter of summer) of each semester
      curriculum: [],
      activeTableIndex: null,
      activeSeason: null, // winter of summer, which is relevant for searching courses
      showSearch: false, // Whether the search bar on the left of the screen is visible
      showImportWindow: false, // Whether the import file window is visible
      showResetWindow: false, // Whether the reset all window is visible
      showHelp: false, // Whether the help window is visible
      trackNames: ['FDS', 'MLS', 'BDHPC', 'VAST'],
      requirements: {
        foundations: 36, // Total ECTS of foundations courses
        interdisciplinary: 9, // Total ECTS of interdisciplinary data science courses
        cores: 2, // Minimum number of cores required
        specialisation: 36, // Number of ECTS required for specialisation courses
        transferable: 4.5, // Minimum number of ECTS required for transferable skills courses
    freeElectives: 4.5, // Base minimum number of ECTS required for free electives
        thesis: 30, // Number of ECTS required for the thesis
      },
    showTSKDropdown: false,
    showFreeElectivesDropdown: false,
    };
  },
  created: async function() {
    await this.loadCurriculumFromTSV(); // Wait for the curriculum to be fully loaded
    let storedSemesters = localStorage.getItem('semesters');
    if (storedSemesters) {
      this.tables = this.updateCourses(JSON.parse(storedSemesters));
      console.log('Chosen courses loaded from local storage.');
    } else {
      console.log('No chosen courses found in local storage.');
    }
    let storedSeasons = localStorage.getItem('seasons');
    if (storedSeasons) {
      this.seasons = JSON.parse(storedSeasons);
      console.log('Semester seasons loaded from local storage.');
    } else {
      console.log('No semester seasons found in local storage.');
    }
  },
  computed: {
      freeElectivesRequired() {
        // Overhang = specialisationCompleted - 36
        const overhang = Math.max(this.specialisationCompleted - this.requirements.specialisation, 0);
        return Math.max(this.requirements.freeElectives - overhang, 0);
      },
    chosenCourses() {
      return this.flattenTables(this.tables)
    },
      tskCourses() {
        // Courses that count toward Transferable Skills (TSK)
        return this.chosenCourses.filter(course => course.module === 'TSK');
      },
      freeElectiveCourses() {
          // Only show courses that actually contribute to the ECTS value in freeElectivesCompleted
          let result = [];
          let ueberhangECTS = 0;
          let ueberhangCourses = [];
          // 1. Specialisation (core & extension) courses not counted toward specialisation
          for (let i in this.trackNames) {
            if (!this.coresCompleted[i]) {
              // If core not completed, all core & extension count as free electives
              result.push(...this.chosenCourses.filter(course => course.module.includes(this.trackNames[i] + '/CO')));
              result.push(...this.chosenCourses.filter(course => course.module.includes(this.trackNames[i] + '/EX')));
            } else {
              // If core completed, only extension credits above 18 count as free electives
              let extCourses = this.chosenCourses.filter(course => course.module.includes(this.trackNames[i] + '/EX'));
              let extCredits = 0;
              for (let course of extCourses) {
                if (extCredits < 18) {
                  extCredits += course.credits;
                } else {
                  ueberhangCourses.push(course);
                  ueberhangECTS += course.credits;
                }
              }
            }
          }
          // Add Überhang entry if any extension overhang is present
          if (ueberhangECTS > 0) {
            result.unshift({ title: `Überhang (Extension Overhang): ${ueberhangECTS} ECTS from extensions above 18 ECTS per track`, credits: ueberhangECTS, type: 'info' });
            // Also list the individual overhang courses below the info entry
            ueberhangCourses.forEach(course => {
              result.unshift({ ...course, title: `${course.title} (Extension Overhang)`, type: 'ueberhang' });
            });
          }
          // 2. Transferable skills beyond required 4.5 ECTS
          let tskCourses = this.tskCourses;
          let tskCredits = tskCourses.reduce((acc, course) => acc + course.credits, 0);
          let tskExcess = tskCredits - 4.5;
          if (tskExcess > 0) {
            // Only show the courses that make up the excess, splitting if needed
            let runningTotal = 0;
            for (let course of tskCourses) {
              let remaining = tskExcess - runningTotal;
              if (remaining <= 0) break;
              let addCredits = Math.min(course.credits, remaining);
              if (addCredits > 0) {
                // If only part of the course counts, show as 'TSK (partial)'
                let title = addCredits < course.credits ? `${course.title} (TSK, partial)` : course.title;
                result.push({ ...course, credits: addCredits, title });
                runningTotal += addCredits;
              }
            }
          }
          // 3. Courses with module Free Elective
          result.push(...this.chosenCourses.filter(course => course.module === 'Free Elective'));
          return result;
      },
    availableCourses() {
      console.time("availableCourses"); // Start timer
      let result;
      console.log('chosenCourses:', this.chosenCourses); // debugging
      if (this.chosenCourses.length === 0) {
        result = this.curriculum;
      } else {
        result = this.curriculum.filter(course =>
            !this.chosenCourses.some(
                chosen => chosen.title === course.title && chosen.type === course.type
            )
        );
      }
      console.timeEnd("availableCourses"); // End timer after computation
      return result;
    },
    // Counting what has been completed:
    foundationsCompleted() {
      return this.moduleCompleted('Foundations');
    },
    interdisciplinaryCompleted() {
      return this.moduleCompleted('DSA');
    },
    coresCompleted() { // an array of booleans: one boolean for each core
      return this.trackNames.map(track => this.coreCredits(track) === 6);
    },
    specialisationCompleted() {
      return this.countSpecialisation()[0]; // first element: specialisation credits
    },
    extraSpecialisationCredits() {
      return this.countSpecialisation()[1]; // second element: free electives
    },
    transferableCompleted() {
      return this.moduleCompleted('TSK');
    },
    freeElectivesCompleted() {
      /* Free electives can come from 3 sources:
      1- specialisation (core & extension) courses which don't count towards the specialisation
      2- transferable skills courses beyond the required 4.5 ECTS
      3- courses outside the curriculum
      */
      let externalCourses = this.chosenCourses.filter(course => course.module === "Free Elective"); // get the external courses
      // console.log('extraSpecialisationCredits:', this.extraSpecialisationCredits); // debugging
      return this.extraSpecialisationCredits
          + max([this.transferableCompleted - 4.5, 0])
          + externalCourses.reduce((acc, course) => acc + course.credits, 0);
    },
    thesisCompleted() {
      return this.moduleCompleted('Thesis');
    },

    // Check if the requirements are met:
    foundationsCheck() {
      return this.foundationsCompleted >= this.requirements["foundations"];
    },
    interdisciplinaryCheck() {
      return this.interdisciplinaryCompleted >= this.requirements["interdisciplinary"];
    },
    coresCheck() {
      return this.coresCompleted.filter(Boolean).length >= this.requirements["cores"];
    },
    specialisationCheck() {
      return this.specialisationCompleted >= this.requirements["specialisation"];
    },
    transferableCheck() {
      return this.transferableCompleted >= this.requirements["transferable"];
    },
    freeElectivesCheck() {
      return this.freeElectivesCompleted >= this.freeElectivesRequired;
    },
    thesisCheck() {
      return this.thesisCompleted >= this.requirements["thesis"];
    },
  },
  watch: { // Automatically save courses to local storage when they change
    tables: {
      handler(newTables) {
        localStorage.setItem('semesters', JSON.stringify(newTables));
      },
      deep: true,
    },
    seasons: {
      handler(newSeasons) {
        localStorage.setItem('seasons', JSON.stringify(newSeasons));
      },
      deep: true,
    },
    curriculum: {
      handler(newCourses) {
        localStorage.setItem('curriculum', JSON.stringify(newCourses));
      },
      deep: true,
    }
  },
  methods: {
    /**
     * Load the curriculum from the curriculum.tsv file
     */
    async loadCurriculumFromTSV() {
      return fetch('curriculum.tsv')
          .then(response => response.text())
          .then(data => {
            const splitData = data.split('\n');
            // console.log('splitData[-1].length:', splitData.at(-1).length); // debugging
            if (splitData.at(-1).trim().length < 2) { // if the last line is empty
              splitData.pop(); // remove the last line (because it always causes errors)
            }
            const cleanedData = splitData.join('\n'); // put the lines back together
            this.curriculum = Papa.parse(cleanedData, { header: true, delimiter: '\t', skipEmptyLines: true })
                .data.map(course => {
              course.credits = Number(course.credits);
              return course;
            });
            console.log('Curriculum loaded from the TSV file.');
          })
          .catch(error => {
            console.error('Error loading curriculum from TSV:', error);
          });
    },
    /**
     * Add a semester to put new courses into
     * @param index The number of the semester to add
     * @param season 'W' or 'S' for winter or summer
     */
    addSemester(index, season) {
      this.tables.splice(index, 0, { rows: [] });
      this.seasons.splice(index, 0, season);
    },
    /**
     * Remove a semester and all its courses
     * @param tableIndex The number of the semester to remove
     */
    removeSemester(tableIndex) {
      // first, empty the semester
      let semester = this.tables[tableIndex];
      for (let i = semester.rows.length - 1; i >= 0; i--) { // start from the end of each semester
        this.handleRemoveCourse(i, tableIndex);
      }
      // then, remove the semester
      this.tables.splice(tableIndex, 1);
      this.seasons.splice(tableIndex, 1);
    },
    /**
     * Enable search for adding a course to a semester
     * @param tableIndex the number of the semester for which to add the course
     * @param season the season of the semester, 'W' or 'S'
     */
    activateSearch(tableIndex, season) {
      this.activeTableIndex = tableIndex;
      this.activeSeason = season;
      this.showSearch = true; // Show the search bar
    },
    /**
     * Add a course to the active semester
     * @param course The course to add to the active semester
     */
    addCourseToSemester(course) {
      if (this.activeTableIndex !== null) {
        this.tables[this.activeTableIndex].rows.push(course); // Add the course to the active semester
        const courseExists = this.curriculum.some(c =>
            // c.code === course.code &&
            // c.module === course.module &&
            c.title === course.title &&
            c.type === course.type
        );
        if (!courseExists) { // if the course is not in the curriculum
          this.curriculum.push(course); // add the course to the curriculum
          console.log('Adding ' + course.title + ' to the curriculum');
        }
        // TODO: if exact course is not in the curriculum, add a warning
        this.showSearch = false; // Hide search after selection

      }
    },
    /**
     * Remove a specific course from a semester
     * @param rowIndex the index of the course to remove in the semester 
     * @param tableIndex the index of the semester in which the course is
     */
    handleRemoveCourse(rowIndex, tableIndex) { // Remove the course from the given table and row index
      console.log('Removing course at table', tableIndex, 'and row', rowIndex);
      let course = this.tables[tableIndex].rows[rowIndex]; // Get the course at the given index
      this.tables[tableIndex].rows.splice(rowIndex, 1); // Remove the course at the given index
      
    },
    /**
     * Remove all courses and reset the curriculum to default
     */
    resetAll() {
      this.showResetWindow = false; // hide the reset window
      this.tables = []; // remove all chosen courses
      this.seasons = []; // remove all semester seasons
      return this.loadCurriculumFromTSV(); // reload the curriculum
    },
    /**
     * Count the number of credits completed for a module
     * @param {string} moduleName - The name of the module
     * @returns {number} - The sum of credits of the chosen courses in the module
     */
    moduleCompleted(moduleName) {
      let moduleCourses = this.chosenCourses.filter(course => course.module === moduleName); // get the chosen courses
      return moduleCourses.reduce((acc, course) => acc + course.credits, 0); // sum of credits of the chosen courses
    },
    /**
     * Count the number of credits completed in the core of a track
     * @param trackName - The name of the track, for example 'MLS'
     */
    coreCredits(trackName) {
      // console.log('trackName:', trackName); // debugging
      let chosenCores = this.chosenCourses.filter(course => course.module.includes(trackName + '/CO')); // all chosen courses in the core
      // console.log('chosenCores:', chosenCores); // debugging
      return chosenCores.reduce((acc, course) => acc + course.credits, 0); // completed credits of the core
    },
    /**
     * Count the number of credits completed in the extension of a track
     * @param trackName - The name of the track, for example 'MLS'
     */
    extensionCredits(trackName) {
      let chosenExtensions = this.chosenCourses.filter(course => course.module.includes(trackName + '/EX')); // all chosen courses in the extension
      // console.log('chosenExtensions:', chosenExtensions); // debugging
      return chosenExtensions.reduce((acc, course) => acc + course.credits, 0); // completed credits of the extension
    },
    /**
     * Count the credits which count towards specialisation, and the core & extension credits that don't count
     */
    countSpecialisation() { 
      let specCredits = 0;
      let extraCredits = 0;
      for (let i in this.trackNames) { // for each track
        if (this.coresCompleted[i]) { // if the core of the track is completed
          specCredits += this.coreCredits(this.trackNames[i]); // core credits count
          specCredits += min([this.extensionCredits(this.trackNames[i]), 18]); // Only a maximum of 18 extension credits from the same track can count
          extraCredits += max([this.extensionCredits(this.trackNames[i]) - 18, 0]); // credits beyond 18 ECTS count only as free electives
        } else { // if the core of the track is not completed
          extraCredits += this.coreCredits(this.trackNames[i]); // core credits count as free electives
          extraCredits += this.extensionCredits(this.trackNames[i]); // extensions count as free electives
        }
      }
      extraCredits += max([specCredits - 36, 0]); // credits beyond 36 ECTS count as free electives
      return [specCredits, extraCredits];
    },
    /**
     * Download a JSON file with the chosen courses
     */
    exportTablesAsJson() {
      // Convert the tables data to JSON
      const exportData = {
        seasons: this.seasons,
        tables: this.tables,
      };
      const jsonData = JSON.stringify(exportData, null, 2);

      // Create a blob with JSON data and set MIME type to application/json
      const blob = new Blob([jsonData], { type: "application/json" });

      // Create a link to download the blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "chosen_courses.json";

      // Append link to the body, click it to start download, and remove it afterward
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      URL.revokeObjectURL(url);
    },
    /**
     * Replace the tables variable with courses from a user file
     * @param event - The event object from the file input
     */
    async importTablesFromJson(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            // Parse JSON and assign to tables
            let importData = JSON.parse(e.target.result); // read the JSON file
            this.showImportWindow = false; // hide the import window
            await this.resetAll(); // remove all previously chosen courses
            this.tables = this.updateCourses(importData.tables);
            this.seasons = importData.seasons;
          } catch (error) {
            console.error("Invalid JSON file:", error);
            alert("Failed to load file. Please make sure it’s a valid JSON.");
          }
        };

        reader.readAsText(file);
      }
    },
    /**
     * For each course, look for it in the curriculum. If present, put that course info in the result. If not, put the course as it is.
     * @param courses - An array of arrays of courses corresponding to semesters
     */
    updateCourses(courses) {
      var result = [];
      for (let table of courses) {
        var rows = [];
        for (let course of table.rows) {
          let courseType = '' // in the new implementation, the type is an empty string when there is no type.
          if (course.type !== 'N/A') { // in the previous implementation, the type was 'N/A' for the thesis.
            courseType = course.type;
          }
          let matchingCourses = this.curriculum.filter(c => c.title === course.title && c.type === courseType && c.semester === course.semester);
          if (matchingCourses.length === 0) {
            console.log('Warning: course not found in the curriculum:', course.title, course.type, course.semester);
            // TODO: add a warning attribute to each course, so that a warning is displayed next to the title, indicating if the course is not in the curriculum
            rows.push(course); // add the course as it is
          } else if (matchingCourses.length > 1) {
            rows.push(matchingCourses[0]);
            console.log('Warning: multiple courses found in the curriculum:', course.title, course.type, course.semester);
          } else { // if there is exactly one matching course
            rows.push(matchingCourses[0]);
          }
        }
        result.push({ rows: rows });
      }
      return result;
    },
    /**
     * Return a single array of courses, instead of an array of arrays of courses
     * @param tables - An array of tables, each containing an array of rows
     */
    flattenTables(tables) {
      if (!tables || !Array.isArray(tables)) {
        throw new Error("Invalid input: 'tables' should be an array.");
      }
      return tables.reduce((acc, table) => {
        if (Array.isArray(table.rows)) {
          acc.push(...table.rows);
        }
        return acc;
      }, []);
    },
  },
};

</script>

<template>
  <div id="app-container">
    <div id="warning">
      <p>This is <b>not</b> an official app provided by TU Wien, only a tool to help you plan your curriculum.
      Official information can be found in the
        <a href="https://www.tuwien.at/fileadmin/Assets/dienstleister/studienabteilung/MSc_Studienplaene_2024/Masterstudium_Data_Science_2024.pdf">curriculum</a>.
      </p>
    </div>
    <div id="header">
      <h1>Data science master's curriculum planner</h1>
      <div id="menu">
        <p class="faded">Chosen courses are saved to local storage, but can disappear after a few days.</p>
        <button class="faded menu-button" @click="exportTablesAsJson">Export courses</button>
        <input
            type="file"
            @change="importTablesFromJson"
            accept=".json"
            style="display: none"
            ref="fileInput"
        />
        <button class="faded menu-button" @click="showImportWindow = true">Import courses</button>
        <button class="faded menu-button" @click="showResetWindow = true">Reset all</button>
        <button class="faded menu-button" @click="showHelp = true">Help</button>
        <a class="faded menu-button" href="https://github.com/Emile-Jn/curriculum-planner" target="_blank">Contribute to this app</a>
      </div>
    </div>
    <div v-if="showHelp" id="help">
      <span class="close-icon" @click="showHelp = false">×</span>
      <h3>How to plan the curriculum:</h3>
      <p>
        Important: there is no course which has to be taken before another course (this also applies to the thesis)
        but it's recommended to try and follow this order: mandatory courses (foundations and interdisciplinary
        data science), then cores, then extensions, then the thesis.
      </p>
      <p>
        Since you have to take all courses in the foundations and interdisciplinary data science modules, fill those
        in first. Then, choose at least two tracks out of the four (fundamentals of data science, machine learning
        and statistics, big data and high-performance computing, visual analytics and semantic technologies). For each
        track you choose, select both cores (6 ECTS, otherwise the track won't count) and 0 to 18 ECTS of extensions.
        Cores and extensions must add up to 36 ECTS overall.
      </p>
      <p>
        Then, fill in at least 4.5 ECTS of transferable skills,
        4.5 ECTS of free electives (any course, including from bachelor degrees at TU), and finally the thesis, thesis
        seminar and thesis defense (30 ECTS).
      </p>
      <p>Want to know more about the app? Check out the
        <a href="https://github.com/Emile-Jn/curriculum-planner/blob/main/README.md">description</a>
        in the GitHub repository.
      </p>
      <p>
        If you find a bug, please open a new issue
        <a href="https://github.com/Emile-Jn/curriculum-planner/issues">here</a>.
      </p>
    </div>
    <div v-if="showImportWindow" class="confirmation-window">
      <p>You can import a <b>json</b> file with your chosen courses that was previously downloaded from this app.</p>
      <p> <b>Warning:</b> doing this will <b>remove all courses currently displayed</b> and replace them. </p>
      <div class="binary-buttons">
        <button class="cancel" @click="showImportWindow = false">Cancel</button>
        <button class="confirm" @click="this.$refs.fileInput.click()">Import courses</button>
      </div>
    </div>
    <div v-if="showResetWindow" class="confirmation-window">
      <p> <b>Warning:</b> doing this will reset the curriculum to default and remove all courses.</p>
      <p>If you want to keep you current selection of courses, follow these steps:</p>
      <ol>
        <li>Click 'cancel'</li>
        <li>Export your current selection of courses by clicking 'Export courses'</li>
        <li>Click 'Reset all' and confirm</li>
        <li>Import your previously exported selection of courses by clicking 'Import courses' and choosing the right file</li>
      </ol>
      <div class="binary-buttons">
        <button class="cancel" @click="showResetWindow = false">Cancel</button>
        <button class="confirm" @click="resetAll">Reset all</button>
      </div>
    </div>
    <div class="search">
      <SearchBar
          v-if="showSearch"
          :courses="availableCourses"
          :season="activeSeason"
          @select-course="addCourseToSemester"
          @close-search="showSearch = false"
      />
    </div>
    <!-- The overlay, which darkens the background when active -->
    <div v-if="showSearch || showImportWindow || showHelp || showResetWindow"
         id="overlay"
         @click="showSearch = showImportWindow = showHelp = showResetWindow = false"></div>
    <div class="container">
      <div class="tables">
        <div>
          <SemesterButtons
              :index="0"
              @add-semester="addSemester"/>
        </div>
        <div v-for="(table, tableIndex) in tables" :key="tableIndex">
          <Semester
              :rows="table.rows"
              :table-index="tableIndex"
              :season="seasons[tableIndex]"
              @activate-search="activateSearch"
              @remove-course="handleRemoveCourse"
              @remove-semester="removeSemester"
          />
          <SemesterButtons
              :index="tableIndex + 1"
              @add-semester="addSemester"/>
        </div>
      </div>
      <div class="requirements">
        <h2> <b>Requirements</b> </h2>
        <div class="req">
          <h3>Foundations courses</h3>
          <p>{{ this.foundationsCheck ? "✅" : "❌" }} {{ this.foundationsCompleted }} /
            {{ this.requirements["foundations"] }} ECTS</p>
        </div>
        <div class="req">
          <h3>Interdisciplinary data science</h3>
          <p>{{ this.interdisciplinaryCheck ? "✅" : "❌" }} {{ this.interdisciplinaryCompleted }} /
            {{ this.requirements["interdisciplinary"] }} ECTS</p>
        </div>
        <div class="req">
          <h3>Cores</h3>
          <p>{{ this.coresCheck ? "✅" : "❌" }} {{ this.coresCompleted.filter(Boolean).length }} /
            {{ this.requirements["cores"] }} cores</p>
        </div>
        <div class="req">
          <h3>Specialisation courses</h3>
          <p>{{ this.specialisationCheck ? "✅" : "❌" }} {{ this.specialisationCompleted }} /
            {{ this.requirements["specialisation"] }} ECTS</p>
        </div>
          <div class="req">
            <h3 style="display: flex; align-items: center; justify-content: space-between;">
              <span>Transferable skills</span>
              <span @click="showTSKDropdown = !showTSKDropdown" style="cursor:pointer; margin-left:8px;">
                <span v-if="!showTSKDropdown">▼</span>
                <span v-else>▲</span>
              </span>
            </h3>
            <p>{{ this.transferableCheck ? "✅" : "❌" }} {{ this.transferableCompleted }} /
              {{ this.requirements["transferable"] }} ECTS</p>
            <ul v-if="showTSKDropdown" style="margin-top:6px;">
              <li v-for="course in tskCourses" :key="course.title + course.type">
                {{ course.title }} ({{ course.credits }} ECTS)
              </li>
              <li v-if="tskCourses.length === 0" style="color:#888;">No TSK courses chosen</li>
            </ul>
          </div>
          <div class="req">
                <h3 style="display: flex; align-items: center; justify-content: space-between;">
                  <span>Free electives</span>
                  <span @click="showFreeElectivesDropdown = !showFreeElectivesDropdown" style="cursor:pointer; margin-left:8px;">
                    <span v-if="!showFreeElectivesDropdown">▼</span>
                    <span v-else>▲</span>
                  </span>
                </h3>
                <p>{{ this.freeElectivesCheck ? "✅" : "❌" }} {{ Math.min(this.freeElectivesCompleted, freeElectivesRequired) }} /
                  {{ freeElectivesRequired }} ECTS</p>
            <ul v-if="showFreeElectivesDropdown" style="margin-top:6px;">
                      <li style="color:#666; font-size:13px; margin-bottom:8px;">
                        <span>
                          <b>Note:</b> Overhang of specialisation courses<br>
                          (credits above 36 ECTS) can reduce the number of free electives needed.
                        </span>
                      </li>
                      <li v-for="(course, idx) in freeElectiveCourses" :key="course.title + course.type">
                        <template v-if="course.type === 'info'">
                          <b>{{ course.title }}</b>
                          <br>
                          <span style="color:#666; font-size:13px;">The above ECTS from extensions are counted as free electives due to exceeding the allowed 18 ECTS per track.</span>
                        </template>
                        <template v-else>
                          {{ course.title }} ({{ course.credits }} ECTS)
                        </template>
                      </li>
                      <li v-if="freeElectiveCourses.length === 0" style="color:#888;">No free electives chosen</li>
            </ul>
          </div>
        <div class="req">
          <h3>Thesis</h3>
          <p>{{ this.thesisCheck ? "✅" : "❌" }} {{ this.thesisCompleted }} /
            {{ this.requirements["thesis"] }} ECTS</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

#warning {
  background: #ffd178;
  text-align: center;
  padding: 2px;
}
#header {
  text-align: center;
  padding: 10px;
  background: #F6FAFD;
  position: relative; /* Allows the shadow to be positioned relative to the element */
  /* padding-bottom: 5px; /* Space between content and shadow border */
  margin-bottom: 15px; /* Space below the shadow */
  box-shadow: 0px 4px 6px -2px rgba(0, 0, 0, 0.3); /* Bottom-only shadow */

}
/* Overlay to darken the background */
#overlay {
  position: fixed; /* Cover the whole screen */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3); /* Semi-transparent black */
  /* display: none; /* Hidden by default */
  z-index: 1; /* Place it above other content */
}

.container {
  display: flex;
  /* justify-content: flex-start; /* Align the tables to the left */
  /* align-items: flex-start;    /* Align the content at the top */
  height: 100%;
  width: 100%;
  box-sizing: border-box; /* Include padding/border in width calculation */
  padding: 20px;
  background-color: white; /* TODO: change */
}

#menu {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  color: #888888;
}
.faded {
  background: none;
  border: none;
  font-size: 14px;
  padding: 0;
  margin-left: 10px;
  margin-right: 10px;
  margin-bottom: 0;
  line-height: 1.5;
}
.menu-button {
  color: #666666;
  text-decoration: none;
}
.menu-button:hover {
  color: #222222;
  cursor: pointer;
}
#help {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translate(-50%, 0%);
  background-color: white;
  padding: 25px;
  border-radius: 5px;
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
  width: 40%;
  overflow-y: auto; /* Enable vertical scrolling */
  z-index: 2;
}
#help p {
  margin-top: 15px;
}
.close-icon {
  position: absolute;
  top: 5px;
  right: 10px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  color: #900; /* Color for the close icon */
}
.tables {
  flex: 1; /* The tables take up remaining space */
  display: flex;
  flex-direction: column;
  /* width: 60%; */
  box-sizing: border-box; /* Include padding/border in width calculation */
  overflow-y: auto; /* Enable vertical scrolling */
  max-height: 100vh; /* Ensure the tables take up full height */
  margin-right: 20px; /* Space between tables and requirements section */
}
.requirements {
  position: sticky;
  margin-left: auto;
  padding: 15px;
  max-height: 80vh; /* Make sure it takes almost full viewport height */
  overflow-y: auto; /* Enable vertical scrolling if content exceeds */
  background: #f5f5f5;
  border-radius: 15px;
  border: 1px solid #999;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
}
.req {
  /* top: 20px; /* Keep the requirements section sticky from top */
  /* width: %; /* Fixed width for the requirements section */
  background-color: #F6E8BB;
  border: 1px solid #111;
  padding: 10px;
  margin: 5px;
  border-radius: 5px;
}
h3,
p {
  margin: 0;
}
</style>
