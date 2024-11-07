<script>
import Semester from './Semester.vue';
import SearchBar from './SearchBar.vue';
import Papa from 'papaparse';
import _, {max, min} from 'lodash';

export default {
  components: {
    Semester,
    SearchBar,
  },
  data() {
    return {
      tables: [],
      seasons: [], // Season (winter of summer) of each semester
      courses: [],
      availableCourses: [],
      chosenCourses: [],
      activeTableIndex: null,
      activeSeason: null, // winter of summer, which is relevant for searching courses
      showSearch: false, // Whether the search bar on the left of the screen is visible
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
    }
  },
  methods: {
    addSemester(season) {
      this.tables.push({ rows: [] });
      this.seasons.push(season);
    },
    activateSearch(tableIndex, season) {
      this.activeTableIndex = tableIndex;
      this.activeSeason = season;
      this.showSearch = true; // Show the search bar
    },
    addCourseToSemester(course) {
      if (this.activeTableIndex !== null) {
        this.tables[this.activeTableIndex].rows.push(course); // Add the course to the active semester
        // Previous implementation
        this.chosenCourses.push(course); // Add the course to the chosen courses
        this.availableCourses = this.availableCourses.filter(c => c.code !== course.code); // Remove the course from the available courses
        // New implementation
        this.courses.filter(c => c.code === course.code).forEach(c => c.available = false); // Mark the course as unavailable
        this.courses.filter(c => (c.code === course.code && c.semester === course.semester)).forEach(c => c.chosen = true); // Mark the course as chosen
        // - -
        this.showSearch = false; // Hide search after selection
        this.updateRequirements(course.module);
      }
    },
    handleRemoveCourse(rowIndex, tableIndex) { // Remove the course from the given table and row index
      console.log('Removing course at table', tableIndex, 'and row', rowIndex);
      let course = this.tables[tableIndex].rows[rowIndex]; // Get the course at the given index
      this.tables[tableIndex].rows.splice(rowIndex, 1); // Remove the course at the given index
      // Previous implementation
      this.availableCourses.push(course); // Add the course back to the available courses
      this.chosenCourses = this.chosenCourses.filter(c => c.code !== course.code); // Remove the course from the chosen courses
      // New implementation
      this.courses.filter(c => c.code === course.code).forEach(c => c.available = true); // Mark the course as available
      this.courses.filter(c => (c.code === course.code && c.semester === course.semester)).forEach(c => c.chosen = false); // Mark the course as not chosen
      // - -
      this.updateRequirements(course.module);
    },
    updateRequirements(courseModule) {
      if (courseModule === 'Foundations') {
        this.updateFoundations();
      } else if (courseModule === 'DSA') {
        this.updateInterdisciplinary();
      } else if (courseModule.includes('/CO')) {
        this.updateCores();
        this.updateSpecialisation();
        this.updateFreeElectives();
      } else if (courseModule.includes('/EX')) {
        this.updateSpecialisation();
        this.updateFreeElectives();
      } else if (courseModule === 'TSK') {
        this.updateTransferable();
        this.updateFreeElectives();
      } else if (courseModule === 'Thesis') {
        this.updateThesis();
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
      // Previous implementation
      /* let wholeCore = this.courses.filter(course => course.module.includes(coreName)); // all courses in the core
      let wholeCoreCodes = [...new Set(wholeCore.map(course => course.code))]; // all course codes in the core
      let completed = this.chosenCourses.filter(course => course.module.includes(coreName)); // completed courses in the core
      let credits = completed.reduce((acc, course) => acc + course.credits, 0); // completed credits of the core */
      // New implementation
      let availableCores = this.courses.filter(course => course.module.includes(coreName) && course.available); // all available courses in the core
      let chosenCores = this.courses.filter(course => course.module.includes(coreName) && course.chosen); // all chosen courses in the core
      let credits = chosenCores.reduce((acc, course) => acc + course.credits, 0); // completed credits of the core
      // Debugging
      // console.log('Core:', coreName);
      // console.log('Whole core:', wholeCore);
      // console.log('Completed core:', completed);
      // console.log('Number of courses in total:', this.courses.length);
      // console.log('Number of chosen courses:', this.chosenCourses.length);
      // console.log('core done?', _.isEqual(wholeCore, completed));
      // Previous implementation
      // return [_.isEqual(wholeCore, completed), credits]; // check if all courses in the core are completed
      // New implementation
      console.log('Available cores:', availableCores);
      return [availableCores.length === 0, credits]; // check if no core courses are available = all courses in the core are completed
    },
    updateModule(moduleName, requirementName) { // General function which is sufficient for some requirements and not others
      let chosenCourses = this.chosenCourses.filter(course => course.module === moduleName);
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
        console.log('Core name:', core); // debugging
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
      for (let core in this.coreNames) { // for each core
        let coreCheck = this.coreCompletion(core); // check if the core is completed
        // New implementation
        let trackName = core.split('/')[0]; // get the track name
        let extensionName = trackName + '/EX'; // get the extension name
        let completedExtensions = this.courses.filter(c => c.module === extensionName && c.chosen === true); // get the completed extensions
        let extensionCredits = completedExtensions.reduce((acc, course) => acc + course.credits, 0); // add the credits of the extensions

        if (coreCheck[0]) { // if the core is completed
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
      freeElectiveCredits += max([this.requirements["transferable"]["completed"] - 4.5, 0]); // add the extra TSK credits
      let externalCourses = this.courses.filter(course => course.module === "Free Elective" && course.chosen); // get the external courses
      freeElectiveCredits += externalCourses.reduce((acc, course) => acc + course.credits, 0); // add the credits of the external courses
      this.requirements["freeElectives"]["completed"] = freeElectiveCredits; // update the number of completed free elective credits
    },
    updateThesis() {
      this.updateModule("Thesis", "thesis");
    }
  },
};

</script>

<template>
  <div id="warning">
    <p>This is NOT an official app made by TU Wien, only a tool to help you plan your curriculum.
    Official information can be found in the
      <a href="https://www.tuwien.at/fileadmin/Assets/dienstleister/studienabteilung/MSc_Studienplaene_2024/Masterstudium_Data_Science_2024.pdf">curriculum</a>.
    </p>
  </div>
  <div class="search">
    <SearchBar
        v-if="showSearch"
        :courses="courses.filter(course => course.available)"
        :season="activeSeason"
        @select-course="addCourseToSemester"
    />
  </div>
  <div class="container">

    <div class="tables">
      <div v-for="(table, tableIndex) in tables" :key="tableIndex">
        <Semester
            :rows="table.rows"
            :table-index="tableIndex"
            :season="seasons[tableIndex]"
            @activate-search="activateSearch"
            @remove-course="handleRemoveCourse"
        />
      </div>
      <div id="buttons">
        <button @click="addSemester('winter')">Add winter semester</button>
        <button @click="addSemester('summer')">Add summer semester</button>
      </div>

    </div>
    <div class="requirements">
      <h2>Requirements</h2>
      <div class="req">
        <h3>Foundations courses</h3>
        <h4>{{ this.requirements["foundations"]["check"] }} {{ this.requirements["foundations"]["completed"] }} /
          {{ this.requirements["foundations"]["req"] }} ECTS</h4>
      </div>
      <div class="req">
        <h3>Interdisciplinary data science</h3>
        <h4>{{ this.requirements["interdisciplinary"]["check"] }} {{
            this.requirements["interdisciplinary"]["completed"]
          }} / {{ this.requirements["interdisciplinary"]["req"] }} ECTS</h4>
      </div>
      <div class="req">
        <h3>Cores</h3>
        <h4>{{ this.requirements["cores"]["check"] }} {{ this.requirements["cores"]["completed"] }} /
          {{ this.requirements["cores"]["req"] }} cores</h4>
      </div>
      <div class="req">
        <h3>Specialisation (cores & extensions)</h3>
        <h4>{{ this.requirements["specialisation"]["check"] }} {{ this.requirements["specialisation"]["completed"] }} /
          {{ this.requirements["specialisation"]["req"] }} ECTS</h4>
      </div>
      <div class="req">
        <h3>Transferable skills</h3>
        <h4>{{ this.requirements["transferable"]["check"] }} {{ this.requirements["transferable"]["completed"] }} /
          {{ this.requirements["transferable"]["req"] }} ECTS</h4>
      </div>
      <div class="req">
        <h3>Free electives</h3>
        <h4>{{ this.requirements["freeElectives"]["check"] }} {{ this.requirements["freeElectives"]["completed"] }} /
          {{ this.requirements["freeElectives"]["req"] }} ECTS</h4>
      </div>
      <div class="req">
        <h3>Thesis</h3>
        <h4>{{ this.requirements["thesis"]["check"] }} {{ this.requirements["thesis"]["completed"] }} /
          {{ this.requirements["thesis"]["req"] }} ECTS</h4>
      </div>
    </div>
  </div>
</template>

<style scoped>
html, body {
  height: 98%;
  width: 98%;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: Arial, sans-serif;
  background-color: #bbf6f3;
}
#warning {
  background: #ffd178;
  text-align: center;
}
.container {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center; /* Center content horizontally */
  /* align-items: center; /* Center content vertically */
  height: 96%;
  width: 96%;
  padding-top: 50px;
  padding-bottom: 50px;
  background: #caf8ff;
  z-index: 0;
}


.tables {
  /* flex-grow: 1; */
  /* position: absolute; */
  display: flex;
  overflow-y: auto; /* Enable vertical scrolling */
  max-height: 90%; /* Set max-height for scrollable area */
  /* left: 25%; */
  /* margin: 0 auto; */
  /* margin-left: auto; /* Center the tables horizontally */
  /* margin-right: auto; /* Center the tables horizontally */

  flex-direction: column;
  align-items: center;
  width: 66%;
  padding-left: 10px;
}

.req {
  position: sticky;
  margin: 5px;
  border: 1px solid #111;
  padding: 10px;
  background: #F6E8BB;
}
#buttons {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
button {
  margin: 5px;
  padding: 5px;
  cursor: pointer;
}
</style>
