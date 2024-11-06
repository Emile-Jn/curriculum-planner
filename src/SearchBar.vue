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
  <div>
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
ul {
  background: #F6E8BB;
}
</style>