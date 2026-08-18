import fs from 'fs';
import path from 'path';

let mappingCache = null;
let controlsCache = null;

export const resetCacheForTesting = () => {
  mappingCache = null;
  controlsCache = null;
};

const loadData = () => {
  if (mappingCache && controlsCache) return;

  try {
    const mappingFile = fs.readFileSync('/ccc_integration/finding_to_ccc_mapping.json', 'utf8');
    const mappingData = JSON.parse(mappingFile);
    mappingCache = {};
    for (const item of mappingData.findings || []) {
      mappingCache[item.finding_type] = item;
    }

    const controlsFile = fs.readFileSync('/ccc_integration/ccc_controls.json', 'utf8');
    const controlsData = JSON.parse(controlsFile);
    controlsCache = {};
    for (const domain of controlsData.domains || []) {
      for (const subdomain of domain.subdomains || []) {
        for (const control of subdomain.controls || []) {
          controlsCache[control.id] = { text: control.text, level_mandatory: control.level_mandatory };
          for (const subcontrol of control.subcontrols || []) {
            controlsCache[subcontrol.id] = { text: subcontrol.text, level_mandatory: control.level_mandatory };
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading CCC data:', error);
  }
};

export const getControlsForFinding = (findingType, applicability, classificationLevel) => {
  if (!mappingCache || !controlsCache) {
    loadData();
  }

  if (!findingType || !mappingCache || !mappingCache[findingType]) {
    return [];
  }

  const findingMapping = mappingCache[findingType];

  let controlIds = [];
  if (applicability && applicability.toUpperCase() === 'CSP') {
    controlIds = findingMapping.ccc_controls_csp || [];
  } else {
    controlIds = findingMapping.ccc_controls_cst || [];
  }

  let formattedLevel = null;
  if (classificationLevel) {
    const num = classificationLevel.toString().replace(/[^0-9]/g, '');
    if (num) formattedLevel = `level_${num}`;
  }

  const results = [];
  for (const cid of controlIds) {
    const cData = controlsCache[cid];
    if (!cData) {
      results.push({ id: cid, text: 'Control text not found.' });
      continue;
    }
    
    // Filter by data_classification_level
    if (formattedLevel && cData.level_mandatory && cData.level_mandatory[formattedLevel] === false) {
      continue;
    }
    
    results.push({ id: cid, text: cData.text });
  }

  return results;
};
