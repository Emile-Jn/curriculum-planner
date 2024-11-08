<script>
export default {
  name: "ImportFile"
}
</script>

<template>
  <div id="container">
    <p>You can import a <b>json</b> file with your chosen courses that was previously downloaded from this app.</p>
    <p> <b>Warning:</b> doing this will <b>remove all courses currently displayed</b> and replace them. </p>
    <div id="buttons">
      <button id="cancel" @click="$emit('cancel-import')">Cancel</button>
      <button id="import" @click="$emit('import-json')">Import courses</button>
    </div>
  </div>
</template>

<style scoped>
#container {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translate(-50%, 0%);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #111;
  background-color: white;
  z-index: 2;
}
#buttons {
  display: flex;
  justify-content: center;
}
button {
  margin: 10px;
  font-size: 16px;
  padding: 10px 20px;
  border-radius: 20px; /* Rounded corners */
  color: white;
  border: none; /* Remove default border */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Soft shadow for depth */
}
button:hover {
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15); /* Slightly larger shadow on hover */
  cursor: pointer;
}
#cancel {
  background: #f44336; /* Red */
}
#cancel:hover {
  background: #d32f2f; /* Slightly darker red on hover */
}
#import {
  background: #4CAF50; /* Green */
}
#import:hover {
  background: #388e3c; /* Slightly darker green on hover */
}
</style>