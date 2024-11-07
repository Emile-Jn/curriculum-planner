<script>
export default {
  props: {
    courses: Array,
    season: String
  },
  data() {
    return {
      query: '',
    };
  },
  computed: {
    filteredCourses() {
      return this.courses.filter(course =>
          String(course.title).toLowerCase().includes(String(this.query).toLowerCase()) &&
          // Filter by season: 'winter' or 'summer'
          String(course.semester).toLowerCase().includes(String(this.season).toLowerCase()[0]) // first letter of 'winter' or 'summer'
      );
    }
  },
  methods: {
    selectCourse(course) {
      this.$emit('select-course', course);
      this.query = ''; // Clear search after selection
    },
  },
};
</script>

<template>
  <div id="search-box">
    <span class="close-icon" @click="$emit('close-search', )">×</span>
    <div class="inputs">
      <input id="search-bar"
          type="text"
          v-model="query"
          placeholder="Search for a course by title or code..."
      />
      <button id="other-course">Other course</button>
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
        <tr
            v-for="course in filteredCourses"
            :key="course.code"
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
  z-index: 1;
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
#other-course {
  padding: 6px 10px;
  border: 1px solid black;
  border-radius: 5px;
  background: #f5f5f5;
  font-size: 16px;
  cursor: pointer;
  width: 20%;
}
#search-results {
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
  max-height: 85%; /* TODO: needed ? */
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
</style>