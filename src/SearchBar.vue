<script>
import OtherCourse from './OtherCourse.vue';
export default {
  components: {
    OtherCourse,
  },
  props: {
    courses: Array,
    season: String
  },
  data() {
    return {
      query: '',
      showOtherCourse: false,
      selectedModule: 'All', // Default to show all courses
    };
  },
  computed: {
    filteredCourses() {
      return this.courses.filter(course => {
        const titleMatches = course.title.toLowerCase().includes(this.query.toLowerCase());
        const seasonMatches = String(course.semester).toLowerCase().includes(String(this.season).toLowerCase()[0]); // TODO: fix this
        let moduleMatches = true; // Default to true for 'All' or if no specific condition is matched
        if (this.selectedModule === 'Mandatory') {
          moduleMatches = ['Foundations', 'DSA', 'Thesis'].includes(course.module);
        } else if (this.selectedModule === 'FDS') {
          moduleMatches = ['FDS/EX', 'FDS/CO'].includes(course.module);
        } else if (this.selectedModule === 'MLS') {
          moduleMatches = ['MLS/EX', 'MLS/CO'].includes(course.module);
        } else if (this.selectedModule === 'BDHPC') {
          moduleMatches = ['BDHPC/EX', 'BDHPC/CO'].includes(course.module);
        } else if (this.selectedModule === 'VAST') {
          moduleMatches = ['VAST/EX', 'VAST/CO'].includes(course.module);
        } else if (this.selectedModule === 'Transferable skills') {
          moduleMatches = course.module === 'TSK';
        }
        return titleMatches && seasonMatches && moduleMatches;
      });
    }
  },
  methods: {
    selectCourse(course) {
      this.$emit('select-course', course);
      this.query = ''; // Clear search after selection
    },
    generateKey(course) { // Each course can be uniquely identified by the combination of course type, course title and semester.
      return `${course.type}-${course.title}-${course.semester}`;
    },
    selectModule(module) {
      this.selectedModule = module;
    },
  },
};
</script>

<template>
  <div id="search-box">
    <span class="close-icon" @click="$emit('close-search')">×</span>
    <div class="inputs">
      <input id="search-bar"
          type="text"
          v-model="query"
          placeholder="Search for a course by title or code..."
      />
      <button id="add-other-course" @click="showOtherCourse = true">Other course</button>
    </div>
    <!-- The overlay, which darkens the background when active -->
    <div v-if="showOtherCourse" id="overlay"></div>
    <div id="define-other-course">
      <OtherCourse
          v-if="showOtherCourse"
          @add-course="selectCourse"
          @close-other-course="showOtherCourse = false"
      />
    </div>
    <div id="menu">
      <div id="menu">
        <button :class="{ active: selectedModule === 'All' }" @click="selectModule('All')">All</button>
        <button :class="{ active: selectedModule === 'Mandatory' }" @click="selectModule('Mandatory')">Mandatory</button>
        <button :class="{ active: selectedModule === 'FDS' }" @click="selectModule('FDS')">FDS</button>
        <button :class="{ active: selectedModule === 'MLS' }" @click="selectModule('MLS')">MLS</button>
        <button :class="{ active: selectedModule === 'BDHPC' }" @click="selectModule('BDHPC')">BDHPC</button>
        <button :class="{ active: selectedModule === 'VAST' }" @click="selectModule('VAST')">VAST</button>
        <button :class="{ active: selectedModule === 'Transferable skills' }" @click="selectModule('Transferable skills')">Transferable skills</button>
      </div>
    </div>
    <div class="table-container">
      <table class="scrollable-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Title</th>
            <th>Type</th>
            <th>ECTS</th>
          </tr>
        </thead>
        <tbody>
          <tr class="search-results"
              v-for="course in filteredCourses"
              :key="generateKey(course)"
              @click="selectCourse(course)"
          >
            <td>{{ course.module }}</td>
            <td>{{ course.title }}</td>
            <td>{{ course.type }}</td>
            <td>{{ course.credits }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
#search-box {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translate(-50%, 0%);
  background-color: white;
  padding: 10px 20px;
  border-radius: 5px;
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
  width: 50%;
  height: 70%;
  overflow-y: auto; /* Enable vertical scrolling */
  z-index: 2;
}
.inputs {
  width: 100%;
  margin-bottom: 10px;
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
}
#search-bar {
  width: 70%;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 15px;
  background: #f5f5f5;
  font-size: 16px;
}
#overlay {
  position: fixed; /* Cover the whole screen */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3); /* Semi-transparent black */
  /* display: none; /* Hidden by default */
  z-index: 3; /* Placed between SearchBar (z=2) and OtherCourse (z=4) */
}
#add-other-course {
  padding: 6px 10px;
  border: 1px solid black;
  border-radius: 5px;
  background: #f5f5f5;
  font-size: 16px;
  cursor: pointer;
  width: 20%;
}
.search-results {
  padding: 8px;
  cursor: pointer;
}
table {
  width: 100%;
}
th {
  border: 1px solid black;
}
.table-container {
  max-height: 85%;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.scrollable-table {
  width: 100%;
  border-collapse: collapse;
}

.scrollable-table th,
.scrollable-table td {
  padding: 8px;
  text-align: left;
  border: 1px solid #ccc;
}

.scrollable-table thead th {
  position: sticky;
  top: 0;
  background-color: #f9f9f9;
  z-index: 1;
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
#menu button {
  padding: 5px;
  margin: 4px;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
}
#menu button.active {
  background-color: #ccc; /* Darker background for active button */
}
#menu button:hover {
  background-color: #e0e0e0; /* Lighter background on hover */
}
</style>