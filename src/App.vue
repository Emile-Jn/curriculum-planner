<script>
import Semester from './Semester.vue';
import SearchBar from './SearchBar.vue';
import SemesterButtons from './SemesterButtons.vue';
import ImportFile from './ImportFile.vue';
import Papa from 'papaparse';
import _, {max, min} from 'lodash';

export default {
  components: {
    Semester,
    SearchBar,
    SemesterButtons,
    ImportFile,
  },
  data() {
    return {
      tables: [],
      seasons: [], // Season (winter of summer) of each semester
      courses: [],
      activeTableIndex: null,
      activeSeason: null, // winter of summer, which is relevant for searching courses
      showSearch: false, // Whether the search bar on the left of the screen is visible
      showImportWindow: false, // Whether the import file window is visible
      showHelp: false, // Whether the help window is visible
      extraSpecialisationCredits: 0, // Extra credits from core or extension courses which can only count as free electives
      /* coreNames: ['Modul FDS/CO - Fundamentals of Data Science - Core',
                  'Modul MLS/CO - Machine Learning and Statistics - Core',
                  'Modul BDHPC/CO - Big Data and High Performance Computing - Core',
                  'Modul VAST/CO - Visual Analytics and Semantic Technologies - Core'], */
      coreNames: ['FDS/CO',
                  'MLS/CO',
                  'BDHPC/CO',
                  'VAST/CO'],

      requirements: {
        foundations: {
          completed: 0, // Number of ECTS completed of foundations courses
          req: 36, // Total ECTS of foundations courses
          check: "❌" // Whether all foundations courses have been done
        },
        interdisciplinary: {
          completed: 0, // Number of ECTS completed of interdisciplinary data science courses
          req: 9, // Total ECTS of interdisciplinary data science courses
          check: "❌" // Whether all interdisciplinary data science courses have been done
        },
        cores: {
          completed: 0, // Number of cores completed
          req: 2, // Minimum number of cores required
          check: "❌"  // Whether at least 2 cores have been done
        },
        specialisation: {
          completed: 0, // Number of ECTS completed of specialisation courses
          req: 36, // Number of ECTS required for specialisation courses
          check: "❌" // Whether enough specialisation courses have been done
        },
        transferable: {
          completed: 0, // Number of ECTS completed of transferable skills courses
          req: 4.5, // Minimum number of ECTS required for transferable skills courses
          check: "❌" // Whether enough transferable skills courses have been done
        },
        freeElectives: {
          completed: 0, // Number of ECTS completed of free electives
          req: 4.5, // Minimum number of ECTS required for free electives
          check: "❌" // Whether enough free electives have been done
        },
        thesis: {
          completed: 0, // Number of ECTS completed for the thesis
          req: 30, // Number of ECTS required for the thesis
          check: "❌" // Whether the thesis, seminar and defense have been done
        },
      },
    };
  },
  created() {
    const storedCurriculum = localStorage.getItem('curriculum');
    if (storedCurriculum) {
      this.courses = JSON.parse(storedCurriculum);
      console.log('Curriculum loaded from local storage');
    } else {
      // Load and parse the TSV file
      fetch('curriculum.tsv')
          .then(response => response.text())
          .then(data => {
            this.courses = Papa.parse(data, { header: true, delimiter: '\t' }).data.map(course => {
              course.credits = Number(course.credits);
              course.available = true; // Whether the course can be added to a semester
              course.chosen = false; // Whether the course has been added to a semester
              return course;
            });
            // Store the parsed curriculum in local storage
            localStorage.setItem('curriculum', JSON.stringify(this.courses));
          });
      console.log('Curriculum loaded from the TSV file.');
    }
    let storedSemesters = localStorage.getItem('semesters');
    if (storedSemesters) {
      this.tables = JSON.parse(storedSemesters);
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
  methods: {
    addSemester(index, season) {
      this.tables.splice(index, 0, { rows: [] });
      this.seasons.splice(index, 0, season);
      localStorage.setItem('seasons', JSON.stringify(this.seasons)); // Save semester seasons to local storage
    },
    removeSemester(tableIndex) {
      // first, empty the semester
      let semester = this.tables[tableIndex];
      for (let i = semester.rows.length - 1; i >= 0; i--) { // start from the end of each semester
        this.handleRemoveCourse(i, tableIndex);
      }
      // then, remove the semester
      this.tables.splice(tableIndex, 1);
      this.seasons.splice(tableIndex, 1);
      localStorage.setItem('semesters', JSON.stringify(this.tables)); // Save selected courses to local storage
      localStorage.setItem('seasons', JSON.stringify(this.seasons)); // Save semester seasons to local storage
    },
    activateSearch(tableIndex, season) {
      this.activeTableIndex = tableIndex;
      this.activeSeason = season;
      this.showSearch = true; // Show the search bar
    },
    addCourseToSemester(course) {
      if (this.activeTableIndex !== null) {
        this.tables[this.activeTableIndex].rows.push(course); // Add the course to the active semester
        localStorage.setItem('semesters', JSON.stringify(this.tables)); // Save selected courses to local storage
        console.log('Saving ' + course.title + ' to local storage');
        const courseExists = this.courses.some(c =>
            c.code === course.code &&
            c.module === course.module &&
            c.title === course.title &&
            c.type === course.type
        );
        if (!courseExists) { // if the course is not in the curriculum
          this.courses.push(course); // add the course to the curriculum
          localStorage.setItem('curriculum', JSON.stringify(this.courses)); // Save the updated curriculum to local storage
          console.log('Adding ' + course.title + ' to the curriculum');
        }
        this.courses.filter(c => c.code === course.code).forEach(c => c.available = false); // Mark the course as unavailable
        this.courses.filter(c => (c.code === course.code && c.semester === course.semester)).forEach(c => c.chosen = true); // Mark the course as chosen
        this.showSearch = false; // Hide search after selection
        this.updateRequirements(course.module);
      }
    },
    handleRemoveCourse(rowIndex, tableIndex) { // Remove the course from the given table and row index
      console.log('Removing course at table', tableIndex, 'and row', rowIndex);
      let course = this.tables[tableIndex].rows[rowIndex]; // Get the course at the given index
      this.tables[tableIndex].rows.splice(rowIndex, 1); // Remove the course at the given index
      localStorage.setItem('semesters', JSON.stringify(this.tables)); // Remove course from local storage
      console.log('Removing ' + course.title + ' from local storage');
      this.courses.filter(c => c.code === course.code).forEach(c => c.available = true); // Mark the course as available
      this.courses.filter(c => (c.code === course.code && c.semester === course.semester)).forEach(c => c.chosen = false); // Mark the course as not chosen
      this.updateRequirements(course.module);
    },
    removeAllCourses(){
      this.tables = [];
      this.seasons = [];
      this.courses.forEach(course => {
        course.available = true;
        course.chosen = false;
      });
      localStorage.removeItem('semesters');
      localStorage.setItem('curriculum', JSON.stringify(this.courses));
      localStorage.removeItem('seasons');
      this.updateFoundations();
      this.updateInterdisciplinary();
      this.updateCores();
      this.updateSpecialisation();
      this.updateTransferable();
      this.updateFreeElectives();
      this.updateThesis();
    },
    updateRequirements(courseModule) {
      console.log('Updating requirements for module:', courseModule);
      if (courseModule === 'Foundations') {
        this.updateFoundations(); // Foundations courses can only affect the foundations requirement
      } else if (courseModule === 'DSA') {
        this.updateInterdisciplinary(); // DSA courses can only affect the interdisciplinary requirement
      } else if (courseModule.includes('/CO')) {
        this.updateCores();
        this.updateSpecialisation();
        this.updateFreeElectives(); // Cores can also count as free electives
      } else if (courseModule.includes('/EX')) {
        this.updateSpecialisation();
        this.updateFreeElectives(); // Extensions can also count as free electives
      } else if (courseModule === 'TSK') {
        this.updateTransferable();
        this.updateFreeElectives(); // TSK courses can also count as free electives
      } else if (courseModule === 'Thesis') {
        this.updateThesis(); // Thesis "courses" can only affect the thesis requirement
      } else {
        this.updateFreeElectives()
      }
    },
    updateCheck(requirement) {
      if (this.requirements[requirement]["completed"] >= this.requirements[requirement]["req"]) {
        this.requirements[requirement]["check"] = "✅";
      }
      else {
        this.requirements[requirement]["check"] = "❌";
      }
    },
    coreCompletion(coreName) {
      let availableCores = this.courses.filter(course => course.module.includes(coreName) && course.available); // all available courses in the core
      let chosenCores = this.courses.filter(course => course.module.includes(coreName) && course.chosen); // all chosen courses in the core
      let credits = chosenCores.reduce((acc, course) => acc + course.credits, 0); // completed credits of the core
      if (credits === 6 && availableCores.length === 0) {
        console.log('Warning: core is considered completed, but there are still courses in this core which are' +
            'available. Please make sure your chosen courses are valid.');
      }
      // console.log('Core credits:', credits); // debugging
      return [credits === 6, credits]; // check if no core courses are available = all courses in the core are completed
    },
    updateModule(moduleName, requirementName) { // General function which is sufficient for some requirements and not others
      let chosenCourses = this.courses.filter(course => course.module === moduleName && course.chosen); // get the chosen courses
      this.requirements[requirementName]["completed"] = chosenCourses.reduce((acc, course) => acc + course.credits, 0);
      this.updateCheck(requirementName);
    },
    updateFoundations() {
      this.updateModule("Foundations", "foundations");
    },
    updateInterdisciplinary() {
      this.updateModule("DSA", "interdisciplinary");
    },
    updateCores() {
      let completedCores = 0;
      for (let core of this.coreNames) { // for each core
        // console.log('Core name:', core); // debugging
        if (this.coreCompletion(core)[0]) { // check if the core is completed
          completedCores++; // add 1 to the completed cores
        }
      }
      this.requirements["cores"]["completed"] = completedCores; // update the number of completed cores
      this.updateCheck("cores"); // update the requirement check
    },
    updateSpecialisation() {
      let specialisationCredits = 0;
      let extraCredits = 0;
      for (let core of this.coreNames) { // for each core
        let coreCheck = this.coreCompletion(core); // check if the core is completed
        // console.log('Core check:', coreCheck); // debugging
        // New implementation
        let trackName = core.split('/')[0]; // get the track name
        let extensionName = trackName + '/EX'; // get the extension name
        let completedExtensions = this.courses.filter(c => c.module === extensionName && c.chosen === true); // get the completed extensions
        let extensionCredits = completedExtensions.reduce((acc, course) => acc + course.credits, 0); // add the credits of the extensions

        if (coreCheck[0]) { // if the core is completed
          // console.log('Adding core credits:', coreCheck[1]); // debugging
          specialisationCredits += coreCheck[1]; // add the credits of the core to the specialisation credits
          // add the credits of the extensions to the specialisation credits:
          specialisationCredits += min([extensionCredits, 18]); // Only a maximum of 18 extension credits from the same track can count
          // calculate the extra credits from the extensions:
          let extraTrackCredits = max([extensionCredits - 18, 0]);
          extraCredits += extraTrackCredits; // add the extra credits to the total count
        } else { // extensions can only count as free electives if the core is not completed
          extraCredits += coreCheck[1] // incomplete cores can only count as free electives
          extraCredits += extensionCredits; // add the credits of the extensions to the total count
        }
      }
      this.extraSpecialisationCredits = extraCredits; // update the extra specialisation credits
      // console.log('Specialisation credits:', specialisationCredits); // debugging
      this.requirements["specialisation"]["completed"] = specialisationCredits; // update the number of completed specialisation credits
      this.updateCheck("specialisation");
    },
    updateTransferable() {
      this.updateModule("TSK", "transferable");
    },
    updateFreeElectives() {
      /* Free electives can come from 3 sources:
      1- specialisation (core & extension) courses which don't count towards the specialisation
      2- transferable skills courses beyond the required 4.5 ECTS
      3- courses outside the curriculum
      */
      let freeElectiveCredits = this.extraSpecialisationCredits; // add the extra specialisation credits
      console.log('Extra specialisation credits:', this.extraSpecialisationCredits); // debugging
      freeElectiveCredits += max([this.requirements["transferable"]["completed"] - 4.5, 0]); // add the extra TSK credits
      console.log('Extra TSK credits:', max([this.requirements["transferable"]["completed"] - 4.5, 0])); // debugging
      let externalCourses = this.courses.filter(course => course.module === "Free Elective" && course.chosen); // get the external courses
      freeElectiveCredits += externalCourses.reduce((acc, course) => acc + course.credits, 0); // add the credits of the external courses
      console.log('External courses credits:', externalCourses.reduce((acc, course) => acc + course.credits, 0)); // debugging
      this.requirements["freeElectives"]["completed"] = freeElectiveCredits; // update the number of completed free elective credits
      this.updateCheck("freeElectives");
    },
    updateThesis() {
      this.updateModule("Thesis", "thesis");
    },
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
    importTablesFromJson(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            // Parse JSON and assign to tables
            let importData = JSON.parse(e.target.result); // read the JSON file
            this.showImportWindow = false; // hide the import window
            this.removeAllCourses(); // remove all previously chosen courses
            this.tables = importData.tables;
            this.seasons = importData.seasons;
            for (let table of this.tables) {
              for (let course of table.rows) {
                this.courses.filter(c => c.code === course.code).forEach(c => c.available = false); // Mark the course as unavailable
                this.courses.filter(c => (c.code === course.code && c.semester === course.semester)).forEach(c => c.chosen = true); // Mark the course as chosen
                this.updateRequirements(course.module);
              }
            }
          } catch (error) {
            console.error("Invalid JSON file:", error);
            alert("Failed to load file. Please make sure it’s a valid JSON.");
          }
        };

        reader.readAsText(file);
      }
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
    </div>
    <div id="import-file-window">
      <ImportFile
          v-if="showImportWindow"
          @cancel-import="showImportWindow = false"
          @import-json="this.$refs.fileInput.click()"
      />
    </div>
    <div class="search">
      <SearchBar
          v-if="showSearch"
          :courses="courses.filter(course => course.available)"
          :season="activeSeason"
          @select-course="addCourseToSemester"
          @close-search="showSearch = false"
      />
    </div>
    <!-- The overlay, which darkens the background when active -->
    <div v-if="showSearch || showImportWindow || showHelp" id="overlay"></div>
    <div class="container">
      <!-- Todo: extra add semester buttons -->
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
          <p>{{ this.requirements["foundations"]["check"] }} {{ this.requirements["foundations"]["completed"] }} /
            {{ this.requirements["foundations"]["req"] }} ECTS</p>
        </div>
        <div class="req">
          <h3>Interdisciplinary data science</h3>
          <p>{{ this.requirements["interdisciplinary"]["check"] }} {{
              this.requirements["interdisciplinary"]["completed"]
            }} / {{ this.requirements["interdisciplinary"]["req"] }} ECTS</p>
        </div>
        <div class="req">
          <h3>Cores</h3>
          <p>{{ this.requirements["cores"]["check"] }} {{ this.requirements["cores"]["completed"] }} /
            {{ this.requirements["cores"]["req"] }} cores</p>
        </div>
        <div class="req">
          <h3>Specialisation (cores & extensions)</h3>
          <p>{{ this.requirements["specialisation"]["check"] }} {{ this.requirements["specialisation"]["completed"] }} /
            {{ this.requirements["specialisation"]["req"] }} ECTS</p>
        </div>
        <div class="req">
          <h3>Transferable skills</h3>
          <p>{{ this.requirements["transferable"]["check"] }} {{ this.requirements["transferable"]["completed"] }} /
            {{ this.requirements["transferable"]["req"] }} ECTS</p>
        </div>
        <div class="req">
          <h3>Free electives</h3>
          <p>{{ this.requirements["freeElectives"]["check"] }} {{ this.requirements["freeElectives"]["completed"] }} /
            {{ this.requirements["freeElectives"]["req"] }} ECTS</p>
        </div>
        <div class="req">
          <h3>Thesis</h3>
          <p>{{ this.requirements["thesis"]["check"] }} {{ this.requirements["thesis"]["completed"] }} /
            {{ this.requirements["thesis"]["req"] }} ECTS</p>
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
