import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';
import { nextTick } from 'vue';

// No manual mock here, we want it to load from public/curriculum.tsv or use a real fetch
// However, in a JSDOM environment, fetch needs a base URL or a mock.
// Since the user wants to use loadCurriculumFromTSV() from App.vue, 
// and that calls fetch('curriculum.tsv'), we should provide a realistic mock for fetch.

const fs = require('fs');
const path = require('path');
const curriculumTsvContent = fs.readFileSync(path.resolve(__dirname, '../public/curriculum.tsv'), 'utf8');

// The app might use fetch('curriculum.tsv') or fetch('/curriculum-planner/curriculum.tsv') depending on base
global.fetch = vi.fn((url) => {
  if (url.includes('curriculum.tsv')) {
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(curriculumTsvContent),
    });
  }
  return Promise.reject(new Error('Unknown URL: ' + url));
});

describe('App Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Also mock localStorage directly to be sure
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  });

  it('performs the full sequence of actions as described', async () => {
    // Clear localStorage before mounting to ensure clean state
    localStorage.clear();

    const wrapper = mount(App, {
      global: {
        stubs: {
          // We don't stub components because we need to interact with them
        }
      }
    });

    // Wait for curriculum to load
    await nextTick();
    await nextTick();
    await nextTick(); // sometimes extra ticks are needed for async created

    // 1. Clicks on « add winter semester »
    // Find first SemesterButtons and click "Add winter semester"
    const firstSemesterButtons = wrapper.findComponent({ name: 'SemesterButtons' });
    const addWinterBtn = firstSemesterButtons.findAll('button').find(b => b.text() === 'Add winter semester');
    expect(addWinterBtn.exists()).toBe(true);
    await addWinterBtn.trigger('click');

    // 2. Check that the number of tables is 1
    expect(wrapper.vm.tables.length).toBe(1);
    expect(wrapper.findAll('.table').length).toBe(1);

    // 3. Check that seasons is ‘winter’
    expect(wrapper.vm.seasons).toEqual(['winter']);

    // 4. Clicks on the first « Add summer semester » button
    // Re-finding SemesterButtons because the DOM changed
    const updatedSemesterButtons = wrapper.findAllComponents({ name: 'SemesterButtons' });
    const firstAddSummerBtn = updatedSemesterButtons.at(0).findAll('button').find(b => b.text() === 'Add summer semester');
    expect(firstAddSummerBtn.exists()).toBe(true);
    await firstAddSummerBtn.trigger('click');

    // 5. Check that seasons is [summer, winter]
    expect(wrapper.vm.seasons).toEqual(['summer', 'winter']);

    // 6. Check that the number of tables is 2
    expect(wrapper.vm.tables.length).toBe(2);
    expect(wrapper.findAll('.table').length).toBe(2);

    // 7. Check that all requirements have value 0
    // Check computed properties of App.vue
    expect(wrapper.vm.foundationsCompleted).toBe(0);
    expect(wrapper.vm.interdisciplinaryCompleted).toBe(0);
    expect(wrapper.vm.specialisationCompleted).toBe(0);
    expect(wrapper.vm.transferableCompleted).toBe(0);
    expect(wrapper.vm.freeElectivesCompleted).toBe(0);
    expect(wrapper.vm.thesisCompleted).toBe(0);

    // 8. In the summer semester, click add course
    // Summer semester is the first one (index 0)
    const summerTable = wrapper.findAll('.table').at(0);
    const addCourseBtn = summerTable.find('button');
    expect(addCourseBtn.text()).toBe('Add course');
    await addCourseBtn.trigger('click');

    // Search bar should be visible
    expect(wrapper.vm.showSearch).toBe(true);
    const searchBar = wrapper.findComponent({ name: 'SearchBar' });
    expect(searchBar.exists()).toBe(true);

    // 9. Check that the displayed list in searchbar has at least 100 courses
    // In SearchBar.vue, the results are in tr.search-results
    let searchResults = searchBar.findAll('tr.search-results');
    // curriculum.tsv has ~320 courses. Even filtered by summer, it should have > 100.
    expect(searchResults.length).toBeGreaterThanOrEqual(100);

    // 10. Click on each option (mandatory, FDS, MLS, etc) and check that there are at least 5 courses displayed
    const filterButtons = searchBar.find('#menu').findAll('button');
    // Note: Use exact text matching if possible, or partial
    const filters = ['Mandatory', 'FDS', 'MLS', 'BDHPC', 'VAST', 'Transferable skills'];
    
    for (const filter of filters) {
      const btn = filterButtons.find(b => b.text().includes(filter));
      if (!btn) {
        console.log('Available buttons:', filterButtons.map(b => b.text()));
      }
      expect(btn).toBeDefined();
      await btn.trigger('click');
      searchResults = searchBar.findAll('tr.search-results');
      expect(searchResults.length).toBeGreaterThanOrEqual(5);
    }

    // 11. Go back to ‘all’ and assign the credits of the first course with module ‘foundation’ to a variable
    const allBtn = filterButtons.find(b => b.text().includes('All'));
    await allBtn.trigger('click');
    
    const foundationCourseRow = searchBar.findAll('tr.search-results').find(row => row.findAll('td').at(0).text().includes('Foundations'));
    const foundationCredits = parseFloat(foundationCourseRow.findAll('td').at(3).text());
    
    // 12. Click on this course
    await foundationCourseRow.trigger('click');

    // 13. Check that the foundations requirement is now equal to the variable
    expect(wrapper.vm.foundationsCompleted).toBe(foundationCredits);

    // 14. Delete the first table by clicking on the x button
    const firstTable = wrapper.findAll('.table').at(0);
    const deleteBtn = firstTable.find('.close-icon');
    await deleteBtn.trigger('click');

    // 15. Check that seasons is [winter]
    expect(wrapper.vm.seasons).toEqual(['winter']);

    // 16. Delete the remaining table
    const remainingTable = wrapper.find('.table');
    const deleteRemainingBtn = remainingTable.find('.close-icon');
    await deleteRemainingBtn.trigger('click');

    // 17. Check that seasons is an empty array
    expect(wrapper.vm.seasons).toEqual([]);

    // 18. Check that tables is an empty array
    expect(wrapper.vm.tables).toEqual([]);
  });
});
