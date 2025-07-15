import type { TreeData } from '../types'
import {
  changeAllContourShow,
  changeAllCurvesShow,
  changeAllDataShow,
  changeWellContourShow,
  changeCurvesShow,
  changeSiteWellContourShow,
  changeSiteCurvesShow,
  changeSiteShow,
  changeWellShow,
  getContourIndexListRef,
  getCurvesIndexListRef,
  getSiteData, changeSiteContourShow, changeAllWellContourShow, changeAllSiteContourShow
} from './dataTemp';
import {ref, Ref} from 'vue';

const CurvesIndexListRef = getCurvesIndexListRef();
const ContourIndexListRef = getContourIndexListRef();
const SiteData = getSiteData();

const componentViewDataRef: Ref<TreeData[]> = ref<TreeData[]>([]);
const layoutViewDataRef: Ref<TreeData[]> = ref<TreeData[]>([]);
const defaultExpendIds = ['Layout-all', 'Components-all'];
const allIds = [];
export const getComponentViewDataRef = () => {
  return componentViewDataRef;
};
export const getLayoutViewDataRef = () => {
  return layoutViewDataRef;
};
export const getDefaultExpendIds = () => {
  return defaultExpendIds;
};
export const getAllIds = () => {
  return [...new Set(allIds)];
};

const getTrajectoryAllCheckedStatus = () => {
  let keys = Object.keys(CurvesIndexListRef.value);
  return keys.some(i => CurvesIndexListRef.value[i]);
};
const getCostContourAllCheckedStatus = () => {
  let keys = Object.keys(ContourIndexListRef.value);
  return keys.some(i => ContourIndexListRef.value[i]);
};
const getSiteTrajectoryCheckedStatus = (index: number) => {
  let siteWell = SiteData[index];
  return siteWell.some(i => CurvesIndexListRef.value[i]);
};
const getSiteCostContourCheckedStatus = (index: number) => {
  let siteWell = SiteData[index];
  return siteWell.some(i => ContourIndexListRef.value[i]);
};

const getComponentTrajectoryAllWellViewData = () => {
  let result = [];
  let wellKeys = Object.keys(CurvesIndexListRef.value).sort((a, b) => a - b);
  for (let i = 0; i < wellKeys.length; i++) {
    let key = Number(wellKeys[i]);
    allIds.push(`TrajectoryWell-${key}`);
    result.push({
      id: `TrajectoryWell-${key}`,
      label: `Well ${key + 1}`,
      // checked: getSiteTrajectoryCheckedStatus(key),
      children: []
    });
  }
  return result;
};
const getComponentCostContourAllWellViewData = () => {
  let result = [];
  // 从小到大 按照数字排序
  let wellKeys = Object.keys(ContourIndexListRef.value).sort( (a, b) => a - b);
  for (let i = 0; i < wellKeys.length; i++) {
    let key = Number(wellKeys[i]);
    allIds.push(`CostContourWell-${key}`);
    result.push({
      id: `CostContourWell-${key}`,
      label: `Well ${key + 1}`,
      // checked: getSiteCostContourCheckedStatus(key),
      children: []
    });
  }
  return result;
};
const getComponentCostContourAllSiteViewData = () => {
  let result = [];
  // 从小到大 按照数字排序
  for (let i = 0; i < SiteData.length; i++) {
    let key = i;
    allIds.push(`SiteCostContour-${key}`);
    result.push({
      id: `SiteCostContour-${key}`,
      label: `Site ${key + 1}`,
      // checked: getSiteCostContourCheckedStatus(key),
      children: []
    });
  }
  return result;
};
const getComponentCostContourAllSiteTypeViewData = () => {
  let result = [];
  result.push(
    {
      id: 'CostContourWell-all',
      label: 'SatelliteContour',
      children: getComponentCostContourAllWellViewData()
    },
    {
      id: 'SiteCostContour-all',
      label: 'SiteContour',
      children: getComponentCostContourAllSiteViewData()
    }
  );
  return result;
}

export const initComponentViewData = (checked: boolean = true) => {
  allIds.push('Components-all');
  allIds.push('Trajectory-all');
  allIds.push('CostContour-all');
  let result = {
    id: 'Components-all',
    label: 'View by Components',
    // checked: checked,
    children: [
      {
        id: 'Trajectory-all',
        label: 'Trajectory',
        // checked: getTrajectoryAllCheckedStatus(),
        children: getComponentTrajectoryAllWellViewData()
      },
      {
        id: 'CostContour-all',
        label: 'Cost Contour',
        // checked: getCostContourAllCheckedStatus(),
        children: getComponentCostContourAllSiteTypeViewData()
      }
    ]
  };
  componentViewDataRef.value = [result];
};

const getLayoutWellViewData = (index: number) => {
  let result = [];
  allIds.push(`CostContourWell-${index}`);
  allIds.push(`TrajectoryWell-${index}`);
  result.push(
    {
      id: `CostContourWell-${index}`,
      label: `Well No${index + 1} Cost Contour`,
      children: []
    },
    {
      id: `TrajectoryWell-${index}`,
      label: `Well No${index + 1} Trajectory`,
      children: []
    }
  );
  return result;
};
const getLayoutSiteViewData = (index: number) => {
  let result = [];
  let wellList = SiteData[index];
  allIds.push(`SiteCostContour-${index}`);
  result.push(
    {
      id: `SiteCostContour-${index}`,
      label: `Site ${index + 1} Cost Contour`,
      children: []
    }
  );
  for (let i = 0; i < wellList.length; i++) {
    let key = wellList[i];
    allIds.push(`WellAll-${key}`);
    result.push({
      id: `WellAll-${key}`,
      label: `Well No${key + 1}`,
      children: getLayoutWellViewData(key)
    });
  }
  return result;
};
const getLayoutAllSiteViewData = () => {
  let result = [];
  for (let i = 0; i < SiteData.length; i++) {
    let key = i;
    allIds.push(`Site-${key}`);
    result.push({
      id: `Site-${key}`,
      label: `Site ${key + 1}`,
      children: getLayoutSiteViewData(key)
    });
  }
  return result;
};

export const initLayoutViewData = (checked: boolean = true) => {
  allIds.push('Layout-all');
  let result = {
    id: 'Layout-all',
    label: 'View by Layout',
    // checked: checked,
    children: getLayoutAllSiteViewData()
  };
  layoutViewDataRef.value = [result];
};

export const resolveTreeClicked = (id: string, checked: boolean) => {
  let nodeType: string = id.split('-')[0];
  let index: string = id.split('-')[1];
  if (nodeType === 'Components' || nodeType === 'Layout') {
    changeAllDataShow(!checked);
    return;
  }
  if (nodeType === 'Trajectory' && index === 'all') {
    changeAllCurvesShow(!checked);
    return;
  }
  if (nodeType === 'TrajectorySite' && index !== 'all') {
    changeSiteCurvesShow(parseInt(index), !checked);
    return;
  }
  if (nodeType === 'TrajectoryWell' && index !== 'all') {
    changeCurvesShow(parseInt(index), !checked);
    return;
  }
  if (nodeType === 'CostContour' && index === 'all') {
    changeAllContourShow(!checked);
    return;
  }
  if (nodeType === 'CostContourWell' && index !== 'all') {
    changeWellContourShow(parseInt(index), !checked);
    return;
  }
  if (nodeType === 'CostContourWell' && index === 'all') {
    changeAllWellContourShow(!checked);
    return;
  }
  if (nodeType === 'Site') {
    changeSiteShow(parseInt(index), !checked);
    return;
  }
  if (nodeType === 'WellAll') {
    changeWellShow(parseInt(index), !checked)
    return;
  }
  if (nodeType === 'SiteCostContour' && index !== 'all') {
    changeSiteContourShow(parseInt(index), !checked)
    return;
  }
  if (nodeType === 'SiteCostContour' && index === 'all') {
    changeAllSiteContourShow(!checked)
    return;
  }
};

initComponentViewData();
initLayoutViewData();

