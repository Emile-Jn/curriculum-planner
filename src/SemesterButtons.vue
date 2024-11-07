<script>
export default {
  name: "SemesterButtons",
  props: {
    index: {
      type: Number,
      required: true
    }
  }
}
</script>

<template>
  <div id="buttons">
    <button @click="$emit('add-semester', index, 'winter')">Add winter semester</button>
    <button @click="$emit('add-semester',index, 'summer')">Add summer semester</button>
  </div>
</template>

<style scoped>
#buttons {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  background-color: #4CAF50; /* Green background */
  color: white; /* White text */
  border: none; /* Remove default border */
  border-radius: 5px; /* Rounded corners */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Soft shadow for depth */
  transition: all 0.3s ease; /* Smooth transition for hover effects */
}

button:hover {
  background-color: #459049; /* Slightly darker green on hover */
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15); /* Slightly larger shadow on hover */
}

button:active {
  background-color: #3e8e41; /* Darker green on click */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Smaller shadow on click */
}

button:focus {
  outline: none; /* Remove the default focus outline */
  border: 2px solid #8bca8b; /* Add a custom focus border */
}
</style>