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
  },
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
        <td>{{ row.title }}</td>
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
/* Optional styling */
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
.close-icon {
  position: absolute;
  top: 10px;
  right: 15px;
  cursor: pointer;
  font-size: 18px;
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
  /* color: white; */
  font-size: 16px;
  border: 1px solid black;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  cursor: pointer;
}
</style>