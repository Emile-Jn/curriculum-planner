# Curriculum planner
An app to view and select courses from the Data Science master's curriculum, which automatically checks completion of the different requirements.

Web app available [here](https://emile-jn.github.io/curriculum-planner/).

## Features
- Create a layout of planned semesters.
- Fill in the semesters by searching for courses by course code or title, or scrolling down the tabs for each category.
- Add or remove any course or semester in any order.
- Add any course which is not (or no longer) in the data science curriculum with the 'other course' button.
- The graduation requirements on the right of the screen are automatically up-to-date.
- Selected courses are automatically saved to local storage (usually disappears after a few days).
- Export your course selection to a JSON file with the 'Export courses' button.
- Import a JSON file that was previously exported from this app with the 'Import courses' button.
- Get guidance on how to choose courses with the 'Help' button.

## Contributions
Pull requests, feedback or bug reports are welcome.  
This web app is written in Vue, but most lines of code here are regular HTML, Javascript and CSS, so you can modify 
a lot of things without knowing anything about Vue. If you know the basic of web development, learning the basics of Vue is pretty quick, see the start guide [here](https://vuejs.org/guide/introduction.html). To modify the app, edit one of the Vue components (`.vue` files) 
or add a new one in `/src`. To add files used by the app, put them in the `/public` directory.

## Notes
- Some courses, like Information Visualisation, or Interdisciplinary Lecture Series in Data Science, are offered in
both winter and summer, with different course codes, but they are the same course.
- In case of a bug, for example from importing a corrupted JSON file, it might help to manually delete all variables in
local storage by clicking 'inspect element' > 'storage' > 'local storage' and then right-clicking on the variables.
