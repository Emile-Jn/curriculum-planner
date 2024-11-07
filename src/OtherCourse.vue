<script>
export default {
  name: "OtherCourse",
  data() {
    return {
      moduleNames: ['Free Elective', 'TSK', 'Foundations', 'DSA',
        'FDO/CO', 'FDS/EX', 'MLS/CO', 'MLS/EX', 'BDHPC/CO', 'BDHPC/EX', 'VAST/CO', 'VAST/EX'],
    };
  },
}
</script>

<template>
  <div>
    <h2>Other course</h2>
    <p>Here you can add a course that is not in the list.</p>
    <p>Enter the course title, module, and ECTS credits below:</p>
    <div>
      <label for="title">Title:</label>
      <input type="text" id="title" name="title" required>
    </div>
    <div>
      <label for="module">Module:</label>
      <input type="text" id="module" name="module" required> <!-- Use a dropdown menu instead -->
    </div>
    <div>
      <label for="ects">ECTS:</label>
      <input type="number" id="ects" name="ects" required>
    </div>
    <button>Add course</button>
  </div>
</template>

<style scoped>

</style>