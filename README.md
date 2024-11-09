# Curriculum planner
A web app to view and select courses from the Data Science master's curriculum, which automatically checks completion of 
the different requirements.  
This app was created mainly because the rules for graduation requirements for the data science master's are complicated 
and somewhat ambiguous, and students often make mistakes when initially planning their curriculum.

Web app available [here](https://emile-jn.github.io/curriculum-planner/).

## Features
- Create a layout of planned semesters.
- Fill in the semesters by searching for courses by course code or title.
- Add and remove any course or semester at any time.
- The graduation requirements on the right of the screen are automatically up-to-date.
- Selected courses are automatically saved to local storage (usually disappears after a few days).
- Export you course selection to a JSON file with the 'Export courses' button.
- Import a JSON file that was previously exported from this app with the 'Import courses' button.
- Add any course which is not (or no longer) in the data science curriculum with the 'other course' button.
This can also be a course from another university, but make sure it officially belongs to the module you select.
- Manually added courses are automatically added to the curriculum and behave like other courses,
meaning that they can count towards any requirement, including cores. This is particularly useful
for people who took a core course which is no longer offered but is still valid for graduation.
- Get guidance on how to choose courses with the 'Help' button.

## Contributions
Pull requests, feedback or bug reports are welcome.  
This web app is written in Vue, using the Options API (sometimes maybe the Composition API, unintentionally) but a lot 
of the code is very similar or the same as regular HTML, Javascript and CSS, so you can modify 
a lot of things without knowing anything about Vue. If you know the basics of web development, learning the basics of 
Vue is pretty quick, see the start guide [here](https://vuejs.org/guide/introduction.html).To modify the app, edit one 
of the Vue components (`.vue` files) or add a new one in `/src`.

## Notes
- Some courses, like Information Visualisation, or Interdisciplinary Lecture Series in Data Science, are offered in
both winter and summer, with different course codes, but they are the same course.
- When adding a new course, specifying a course code is optional, but if nothing is entered, a random 6-digit code will 
be generated, so that the course can still be identified in the system.
- In case of a bug, for example from importing a corrupted JSON file, it might help to manually delete all variables in
local storage by clicking 'inspect element' > 'storage' > 'local storage' and then right-clicking on the variables.