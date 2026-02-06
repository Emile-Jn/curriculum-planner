import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from './App.vue';

describe('App.vue logic', () => {
  const mockCourses = [
    { title: 'Course 1', module: 'Foundations', credits: 6, type: 'VU', season: 'w' },
    { title: 'Course 2', module: 'Foundations', credits: 6, type: 'VU', season: 'w' },
    { title: 'Course 3', module: 'DSA', credits: 9, type: 'VU', season: 'w' },
    { title: 'Course 4', module: 'FDS/CO', credits: 6, type: 'VU', season: 'w' },
    { title: 'Course 5', module: 'FDS/EX', credits: 6, type: 'VU', season: 'w' },
    { title: 'Course 6', module: 'TSK', credits: 4.5, type: 'VU', season: 'w' },
    { title: 'Course 7', module: 'Thesis', credits: 30, type: 'VU', season: 'w' },
    { title: 'Extra Specialisation', module: 'FDS/EX', credits: 20, type: 'VU', season: 'w' },
  ];

  const createWrapper = () => {
    return mount(App, {
      global: {
        stubs: {
          Semester: {
            template: '<div />',
            props: ['rows', 'tableIndex', 'season']
          },
          SearchBar: true,
          SemesterButtons: true,
        }
      }
    });
  };

  it('calculates moduleCompleted correctly', async () => {
    const wrapper = createWrapper();
    await wrapper.setData({
      tables: [{ rows: mockCourses }]
    });

    expect(wrapper.vm.moduleCompleted('Foundations')).toBe(12);
    expect(wrapper.vm.moduleCompleted('DSA')).toBe(9);
    expect(wrapper.vm.moduleCompleted('TSK')).toBe(4.5);
    expect(wrapper.vm.moduleCompleted('Thesis')).toBe(30);
  });

  it('calculates coreCredits correctly', async () => {
    const wrapper = createWrapper();
    await wrapper.setData({
      tables: [{ rows: mockCourses }]
    });

    expect(wrapper.vm.coreCredits('FDS')).toBe(6);
    expect(wrapper.vm.coreCredits('MLS')).toBe(0);
  });

  it('calculates extensionCredits correctly', async () => {
    const wrapper = createWrapper();
    await wrapper.setData({
      tables: [{ rows: mockCourses }]
    });

    expect(wrapper.vm.extensionCredits('FDS')).toBe(26); // 6 + 20
  });

  it('calculates specialisation credits correctly', async () => {
    const wrapper = createWrapper();
    // Setting up a state where FDS core is completed (>= 6 credits)
    await wrapper.setData({
      tables: [{ rows: [
        { title: 'FDS Core', module: 'FDS/CO', credits: 6, type: 'VU', season: 'w' },
        { title: 'FDS Ext 1', module: 'FDS/EX', credits: 10, type: 'VU', season: 'w' },
        { title: 'FDS Ext 2', module: 'FDS/EX', credits: 10, type: 'VU', season: 'w' },
      ]}]
    });

    const [specCredits, extraCredits] = wrapper.vm.countSpecialisation();
    // FDS core completed: 6 + min(20, 18) = 24
    expect(specCredits).toBe(24);
    // extra: max(20 - 18, 0) + max(24 - 36, 0) = 2 + 0 = 2
    expect(extraCredits).toBe(2);
  });

  it('calculates freeElectivesCompleted correctly', async () => {
    const wrapper = createWrapper();
    // Sources of free electives:
    // 1. extraSpecialisationCredits
    // 2. transferableCompleted > 4.5
    // 3. module === "Free Elective"
    await wrapper.setData({
      tables: [{ rows: [
        { title: 'FDS Core', module: 'FDS/CO', credits: 6, type: 'VU', season: 'w' },
        { title: 'FDS Ext', module: 'FDS/EX', credits: 20, type: 'VU', season: 'w' }, // 2 extra
        { title: 'Extra TSK', module: 'TSK', credits: 6, type: 'VU', season: 'w' }, // 1.5 extra
        { title: 'External', module: 'Free Elective', credits: 3, type: 'VU', season: 'w' }, // 3 extra
      ]}]
    });

    // transferableCompleted = 6
    // extraSpecialisationCredits = 2 (from 20-18)
    // externalCourses = 3
    // Total = 2 + max(6-4.5, 0) + 3 = 2 + 1.5 + 3 = 6.5
    expect(wrapper.vm.freeElectivesCompleted).toBe(6.5);
  });

  it('checks requirements correctly', async () => {
    const wrapper = createWrapper();
    await wrapper.setData({
      tables: [{ rows: [
        { title: 'FDS Core', module: 'FDS/CO', credits: 6, type: 'VU', season: 'w' },
        { title: 'MLS Core', module: 'MLS/CO', credits: 6, type: 'VU', season: 'w' },
      ]}]
    });

    // coresCompleted should have 2 true values for FDS and MLS
    expect(wrapper.vm.coresCompleted.filter(Boolean).length).toBe(2);
    expect(wrapper.vm.coresCheck).toBe(true);
  });
});
