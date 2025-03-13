<script>
export default {
  props: {
    rows: {
      type: Array,
      required: true,
    },
    tableIndex: {
      type: Number,
      required: true,
    },
    season: {
      type: String,
      required: true,
    },
  },
  computed: {
    totalCredits() {
      return this.rows.reduce((acc, row) => acc + row.credits, 0);
    },
    courseUrl() {
      return (row) => this.makeUrl(row.code, row.semester); // Returns the URL for a course
    }
  },
  methods: {
    openCourseUrl(row) {
      // Get the URL for the course using your existing logic
      const url = this.makeUrl(row.code, row.semester);
      // Open the URL in a new tab
      window.open(url, '_blank');
    },
    makeUrl(courseCode, semester) { // year=null was used, but unnecessary
      if (! courseCode.includes('.')) { // codes without a dot are artificially created
        return '';
      }
      const courseNr = courseCode.replace('.', ''); // Remove the dot in the course code
      if (! Number.isInteger(Number(courseNr))) { // Course code must be a string of digits
        return '';
      }
      const semesterYear = this.getCurrentCourseYear(semester);
      return `https://tiss.tuwien.ac.at/course/courseDetails.xhtml?courseNr=${courseNr}&semester=${semesterYear}`;
    },
    /**
     * Get the latest year + semester in which the specified semester has started.
     * For example, if the date is August 2024 and the semester is 'W', the 2024 winter semester hasn't started yet,
     * so we want to use the 2023 winter semester information.
     * @param semester string - 'W' for winter or 'S' for summer
     * @returns {string} - e.g. 2024W
     */
    getCurrentCourseYear(semester) {
      const now = new Date();
      // Important to check summer first, because in case the course is available in both winter and summer,
      // we want to apply the least restrictive condition (summer)
      let W = semester.toLowerCase().includes('w');
      let S = semester.toLowerCase().includes('s');
      let year = now.getFullYear();
      if (W && S) {
        // If the course is available in both winter and summer
        if (now.getMonth() < 2) { // Months are 0-based; February is 1
          year--; // Use last year's information
        }
        return String(year) + this.getCurrentSemester();
      } else if (S) {
        // Check if the summer semester of this year has not started yet
        if (now.getMonth() < 2) { // Months are 0-based; February is 1
          year--; // Use last year's information
        }
        return String(year) + 'S';
      } else if (W) {
        // Check if the winter semester of this year has not started yet
        if (now.getMonth() < 9) { // Months are 0-based; September is 8
          year--; // Use last year's information
        }
        return String(year) + 'W';
      }
      throw new Error('Invalid semester format.');
    },
    getCurrentSemester() {
      const now = new Date();
      return now.getMonth() < 2 || now.getMonth() > 8 ? 'W' : 'S';
    }
  }
};
</script>

<template>
  <div class="table">
    <!-- Close icon in the upper-right corner -->
    <span class="close-icon" @click="$emit('remove-semester', tableIndex)">×</span>
    <h2>Semester {{ tableIndex + 1 }}  –  {{ season }}</h2>
    <h3>ECTS: {{ totalCredits }}</h3>
    <table>
      <tr>
        <th>#</th>
        <th>Module</th>
        <th>Code</th>
        <th>Title</th>
        <th>Type</th>
        <th>ECTS</th>
        <th>Remove</th>
      </tr>
      <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
        <td class="centred">{{ rowIndex + 1 }}</td>
        <td class="centred">{{ row.module }}</td>
        <td class="centred">{{ row.code }}</td>
        <td>
          <a v-if="courseUrl(row)" :href="this.makeUrl(row.code, row.semester)" target="_blank"  class="title-link">{{ row.title }}</a>
          <span v-else>{{ row.title }}</span>
        </td>
        <td class="centred">{{ row.type }}</td>
        <td class="centred">{{ row.credits }}</td>
        <td class="centred">
          <span @click="$emit('remove-course', rowIndex, this.tableIndex )" class="remove-icon">🗑️</span> <!-- Bin icon -->
        </td>
      </tr>
    </table>
    <button @click="$emit('activate-search', this.tableIndex, this.season)">Add course</button>
  </div>
</template>

<style scoped>
.table {
  position: relative;
  margin: 10px;
  border: 1px solid #111;
  padding: 20px;
  background: #F6E8BB;
  width: 95%;
  box-sizing: border-box; /* Include padding/border in width calculation */
  border-radius: 10px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
}
h2 {
  margin: 0;
}
.close-icon {
  position: absolute;
  top: 10px;
  right: 15px;
  cursor: pointer;
  font-size: 28px;
  font-weight: bold;
  color: #900; /* Color for the close icon */
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #111;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #e0e0e0;
}
td {
  background-color: #f9f9f9;
}
.remove-icon {
  cursor: pointer;
}
.centred {
  text-align: center;
}
button {
  margin-top: 10px;
  padding: 10px;
  background-color: white;
  font-size: 16px;
  border: 1px solid black;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  cursor: pointer;
}
button:hover {
  background-color: #e9e9e9;
}
.title-link {
  cursor: pointer;
  color: #A66024;
  text-decoration: none;
}
.title-link:hover {
  text-decoration: underline;
}
</style>