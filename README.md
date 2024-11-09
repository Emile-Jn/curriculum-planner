# Curriculum planner
An app to view and select courses from the Data Science master's curriculum, which automatically checks completion of the different requirements.

Web app available [here](https://emile-jn.github.io/curriculum-planner/).

## Features
- Create a layout of planned semesters.
- Fill in the semesters by searching for courses by course code or title.
- Add and remove any course or semester at any time.
- Add any course which is not (or no longer) in the data science curriculum with the 'other course' button.
- The graduation requirements on the right of the screen are automatically up-to-date.
- Selected courses are automatically saved to local storage (usually disappears after a few days).
- Export you course selection to a JSON file with the 'Export courses' button.
- Import a JSON file that was previously exported from this app with the 'Import courses' button.
- Get guidance on how to choose courses with the 'Help' button.

## Contributions
Pull requests, feedback or bug reports are welcome.  
This web app is written in Vue, but most lines of code here are regular HTML, Javascript and CSS, so you can modify a lot of things without knowing anything about Vue. To modify the app, edit one of the Vue components (`.vue` files) or add a new one in `/src`.
