<script>
export default {
  props: {
    courses: Array,
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
          :key="course.id"
          @click="selectCourse(course)"
          style="padding: 8px; cursor: pointer;"
      >
        {{ course.title }}
      </div>
    </div>
  </div>
</template>

<style scoped>
ul {
  background: #F6E8BB;
}
</style>