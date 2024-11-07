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
          course.title.toLowerCase().includes(this.query.toLowerCase())
          // Filter by season: 'winter' or 'summer'
          && course.semester.toLowerCase().includes(this.season.toLowerCase()[0]) // first letter of 'winter' or 'summer'
      );
    },
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
    <input
        type="text"
        v-model="query"
        placeholder="Search for a course..."
    />
    <div v-if="filteredCourses.length">
      <div
          v-for="course in filteredCourses"
          :key="course.code"
          @click="selectCourse(course)"
          style="padding: 8px; cursor: pointer;"
      >
        {{ course.title }} {{ course.type }}
      </div>
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

ul {
  background: #F6E8BB;
}
</style>