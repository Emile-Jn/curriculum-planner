<script>
export default {
  name: "OtherCourse",
  data() {
    return {
      moduleNames: ['Free Elective', 'TSK', 'Foundations', 'DSA',
        'FDO/CO', 'FDS/EX', 'MLS/CO', 'MLS/EX', 'BDHPC/CO', 'BDHPC/EX', 'VAST/CO', 'VAST/EX'],
      typeNames: ['VU', 'VO', 'UE', 'PR', 'SE'],
      selectedModule: 'Free Elective',   // Holds selected module
      selectedType: 'VU',     // Holds selected type
      title: '',            // Holds course title
      code: '',             // Holds course code
      credits: 3,               // Holds course ECTS
    };
  },
  computed: {
    // Computed course object based on input data
    course() {
      return {
        module: this.selectedModule,
        title: this.title,
        code: this.code,
        type: this.selectedType,
        semester: 'W and S', // Assume the course is available in both seasons
        credits: this.credits,
        full_module_name: '', // TODO: Implement full module name
      };
    }
  },
}
</script>

<template>
  <div id="container">
    <span class="close-icon" @click="$emit('close-other-course')">×</span>
    <p>Add a course which is (currently) not in the curriculum or in the transferable skills catalogue:</p>
    <table>
      <tr>
        <td>Module:</td>
        <td>
          <select v-model="selectedModule" required>
            <option v-for="module in moduleNames" :value="module">{{ module }}</option>
          </select>
        </td>
      </tr>
      <tr>
        <td>Type:</td>
        <td>
          <select v-model="selectedType" required>
            <option v-for="type in typeNames" :value="type">{{ type }}</option>
          </select>
        </td>
      </tr>
      <tr>
        <td>Title:</td>
        <td><input type="text" v-model="title" required></td>
      </tr>
      <tr>
        <td>Code:</td>
        <td><input type="text" v-model="code" ></td>
      </tr>
      <tr>
        <td>ECTS:</td>
        <td><input type="number" v-model="credits" min="0.5" max="12" required></td>
      </tr>
    </table>
    <button @click="$emit('add-course', course)" :disabled="!title">Add course</button>
  </div>
</template>

<style scoped>
#container {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translate(-50%, 0%);
  background-color: white;
  padding: 10px 20px;
  border-radius: 5px;
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
  z-index: 4;
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