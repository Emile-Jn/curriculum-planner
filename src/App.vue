<script>
import Semester from './Semester.vue';
import SearchBar from './SearchBar.vue';
import Papa from 'papaparse';
import _ from 'lodash';

export default {
  components: {
    Semester,
    SearchBar,
  },
  data() {
    return {
      tables: [],
      courses: [],
      availableCourses: [],
      chosenCourses: [],
      activeTableIndex: null,
      showSearch: false,
      /* coreNames: ['Modul FDS/CO - Fundamentals of Data Science - Core',
                  'Modul MLS/CO - Machine Learning and Statistics - Core',
                  'Modul BDHPC/CO - Big Data and High Performance Computing - Core',
                  'Modul VAST/CO - Visual Analytics and Semantic Technologies - Core'], */
      coreNames: ['FDS/CO',
                  'MLS/CO',
                  'BDHPC/CO',
                  'VAST/CO'],

      courseCategories: {
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
    // Load and parse the TSV file
    fetch('curriculum1.tsv')
        .then(response => response.text())
        .then(data => {
          this.courses = Papa.parse(data, { header: true, delimiter: '\t' }).data.map(course => {
            course.credits = Number(course.credits);
            return course;
          });
          this.availableCourses = JSON.parse(JSON.stringify(this.courses)); // Deep copy the courses array
          console.log(this.availableCourses); // Check the structure of the courses array
        });
  },
  methods: {
    addSemester() {
      this.tables.push({ rows: [] });
    },
    activateSearch(tableIndex) {
      this.activeTableIndex = tableIndex;
      this.showSearch = true; // Show the search bar
    },
    addCourseToSemester(course) {
      if (this.activeTableIndex !== null) {
        this.tables[this.activeTableIndex].rows.push(course); // Add the course to the active semester
        this.chosenCourses.push(course); // Add the course to the chosen courses
        this.availableCourses = this.availableCourses.filter(c => c.code !== course.code); // Remove the course from the available courses
        this.showSearch = false; // Hide search after selection
        this.updateRequirements(course.module);
      }
    },
    handleRemoveCourse(rowIndex, tableIndex) { // Remove the course from the given table and row index
      console.log('Removing course at table', tableIndex, 'and row', rowIndex);
      let course = this.tables[tableIndex].rows[rowIndex]; // Get the course at the given index
      this.tables[tableIndex].rows.splice(rowIndex, 1); // Remove the course at the given index
      this.availableCourses.push(course); // Add the course back to the available courses
      this.chosenCourses = this.chosenCourses.filter(c => c.code !== course.code); // Remove the course from the chosen courses
      this.updateRequirements(course.module);
    },
    updateRequirements(courseModule) {
      if (courseModule === 'Prüfungsfach Data Science - Foundations') {
        this.updateFoundations();
      }
      if (courseModule === 'Prüfungsfach Domain-Specific Aspects of Data Science') {
        this.updateInterdisciplinary();
      }
      // TODO: finish conditional updating of requirements
      this.updateCores();
      this.updateSpecialisation();
      this.updateTransferable();
      this.updateFreeElectives();
      this.updateThesis();
    },
    updateCheck(requirement) {
      if (this.courseCategories[requirement]["completed"] >= this.courseCategories[requirement]["req"]) {
        this.courseCategories[requirement]["check"] = "✅";
      }
      else {
        this.courseCategories[requirement]["check"] = "❌";
      }
    },
    coreCompletion(coreName) {
      let wholeCore = this.courses.filter(course => course.module.includes(coreName)); // all courses in the core
      let credits = wholeCore.reduce((acc, course) => acc + course.credits, 0); // total credits of the core
      let completed = this.chosenCourses.filter(course => course.module.includes(coreName)); // completed courses in the core
      // Debugging
      console.log('Core:', coreName);
      console.log('Whole core:', wholeCore);
      console.log('Completed core:', completed);
      console.log('Number of courses in total:', this.courses.length);
      console.log('Number of chosen courses:', this.chosenCourses.length);
      console.log('core done?', _.isEqual(wholeCore, completed));
      return [_.isEqual(wholeCore, completed), credits]; // check if all courses in the core are completed
    },
    updateFoundations() {
      let chosenFoundations = this.chosenCourses.filter(course => course.module === 'Prüfungsfach Data Science - Foundations');
      this.courseCategories["foundations"]["completed"] = chosenFoundations.reduce((acc, course) => acc + course.credits, 0);
      this.updateCheck("foundations");
    },
    updateInterdisciplinary() {
      let chosenInterdisciplinary = this.chosenCourses.filter(course => course.module === 'Prüfungsfach Domain-Specific Aspects of Data Science');
      this.courseCategories["interdisciplinary"]["completed"] = chosenInterdisciplinary.reduce((acc, course) => acc + course.credits, 0);
      this.updateCheck("interdisciplinary");
    },
    updateCores() {
      let completedCores = 0;
      for (let core of this.coreNames) { // for each core
        if (this.coreCompletion(core)[0]) { // check if the core is completed
          completedCores++; // add 1 to the completed cores
        }
      }
      this.courseCategories["cores"]["completed"] = completedCores; // update the number of completed cores
      this.updateCheck("cores"); // update the requirement check
    },
    updateSpecialisation() {
      let specialisationCredits = 0;
      for (let core in this.coreNames) { // for each core
        let completed = this.coreCompletion(core); // check if the core is completed
        if (completed[0]) {
          specialisationCredits += completed[1]; // add the credits of the core to the specialisation credits
          let splitCoreName = core.split(' - '); // split the core name
          let trackName = splitCoreName[0].split('/')[0]; // get the track name
          let extensionName = trackName + '/CO - ' + splitCoreName[1] + ' - Extension'; // get the extension name
          let completedExtensions = this.chosenCourses.filter(course => course.module === extensionName); // get the completed extensions
          specialisationCredits += completedExtensions.reduce((acc, course) => acc + course.credits, 0); // add the credits of the extensions
        }
      }
      this.courseCategories["specialisation"]["completed"] = specialisationCredits; // update the number of completed specialisation credits
      this.updateCheck("specialisation");
    },
    updateTransferable() {
      // TODO: Implement the updateTransferable method
    },
    updateFreeElectives() {
      // TODO: Implement the updateFreeElectives method
    },
    updateThesis() {
      // TODO: Implement the updateThesis method
    }
  },
};

</script>

<template>
  <div class="container">
    <div class="sidebar">
      <SearchBar
          v-if="showSearch"
          :courses="availableCourses"
          @select-course="addCourseToSemester"
      />
    </div>
    <div class="tables">
      <div v-for="(table, tableIndex) in tables" :key="tableIndex">
        <Semester
            :rows="table.rows"
            :table-index="tableIndex"
            @activate-search="activateSearch(tableIndex)"
            @remove-course="handleRemoveCourse"
        />
      </div>
      <button @click="addSemester">Add Semester</button>
    </div>
    <div class="requirements">
      <h2>Requirements</h2>
      <div class="req">
        <h3>Foundations courses</h3>
        <h4>{{this.courseCategories["foundations"]["check"]}} {{ this.courseCategories["foundations"]["completed"] }} / {{ this.courseCategories["foundations"]["req"] }} ECTS</h4>
      </div>
      <div class="req">
        <h3>Interdisciplinary data science</h3>
        <h4>{{this.courseCategories["interdisciplinary"]["check"]}} {{ this.courseCategories["interdisciplinary"]["completed"] }} / {{ this.courseCategories["interdisciplinary"]["req"] }} ECTS</h4>
      </div>
      <div class="req">
        <h3>Cores</h3>
        <h4>{{this.courseCategories["cores"]["check"]}} {{ this.courseCategories["cores"]["completed"] }} / {{ this.courseCategories["cores"]["req"] }} cores</h4>
      </div>
      <div class="req">
        <h3>Specialisation (cores & extensions)</h3>
        <h4>{{this.courseCategories["specialisation"]["check"]}} {{ this.courseCategories["specialisation"]["completed"] }} / {{ this.courseCategories["specialisation"]["req"] }} ECTS</h4>
      </div>
      <div class="req">
        <h3>Transferable skills</h3>
        <h4>{{this.courseCategories["transferable"]["check"]}} {{ this.courseCategories["transferable"]["completed"] }} / {{ this.courseCategories["transferable"]["req"] }} ECTS</h4>
      </div>
      <div class="req">
        <h3>Free electives</h3>
        <h4>{{this.courseCategories["freeElectives"]["check"]}} {{ this.courseCategories["freeElectives"]["completed"] }} / {{ this.courseCategories["freeElectives"]["req"] }} ECTS</h4>
      </div>
      <div class="req">
        <h3>Thesis</h3>
        <h4>{{this.courseCategories["thesis"]["check"]}} {{ this.courseCategories["thesis"]["completed"] }} / {{ this.courseCategories["thesis"]["req"] }} ECTS</h4>
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
.container {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center; /* Center content horizontally */
  /* align-items: center; /* Center content vertically */
  min-height: 96%;
  width: 96%;
  padding-top: 50px;
  padding-bottom: 50px;
  background: #caf8ff;
}

.sidebar {
  /* width: 300px; /* Adjust the width as needed */
  background-color: #e0e0e0;
  max-width: 25%;
}

.tables {
  /* flex-grow: 1; */
  /* position: absolute; */
  display: flex;
  /* left: 25%; */
  /* margin: 0 auto; */
  margin-left: auto; /* Center the tables horizontally */
  margin-right: auto; /* Center the tables horizontally */

  flex-direction: column;
  align-items: center;
  max-width: 44%;
  padding-left: 10px;
}

.req {
  margin: 5px;
  border: 1px solid #111;
  padding: 10px;
  background: #F6E8BB;
}
</style>
