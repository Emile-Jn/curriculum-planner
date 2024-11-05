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
  },
};
</script>

<template>
  <div class="table">
    <h2>Semester {{ tableIndex + 1 }}</h2>
    <table>
      <tr>
        <th>#</th>
        <th>Code</th>
        <th>Title</th>
        <th>ECTS</th>
        <th>Remove</th>
      </tr>
      <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
        <td>{{ rowIndex + 1 }}</td>
        <td>{{ row.code }}</td>
        <td>{{ row.title }}</td>
        <td>{{ row.credits }}</td>
        <td>
          <span @click="$emit('remove-course', rowIndex, this.tableIndex )" class="remove-icon">🗑️</span> <!-- Bin icon -->
        </td>
      </tr>
    </table>
    <button @click="$emit('activate-search')">Add course</button>
  </div>
</template>

<style scoped>
/* Optional styling */
.table {
  margin-bottom: 20px;
  border: 1px solid #111;
  padding: 10px;
  background: #F6E8BB;
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
  color: red;
}
</style>