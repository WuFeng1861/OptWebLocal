import {eventBus} from '../utils';
// import {getSiteKickOffData} from '../services/dataTemp';
import type {Ref} from 'vue';
import {KickoffPoint} from '../types';

export const useKickoffListen = (kickoffPointsRef:Ref<KickoffPoint[]>) => {
  eventBus.on('updateWellSite', (data) => {
    let {wellNumber, toUngrouped, toSiteId} = data;
    if (toUngrouped) {
      console.log(`Well ${wellNumber} is moved to ungrouped`)
      return;
    }
    console.log(`Well ${wellNumber} is moved to site ${toSiteId}`)
    // const targetKickOffData = getSiteKickOffData(toSiteId);
    // kickoffPointsRef.value[wellNumber - 1].pkx = targetKickOffData.pkx;
    // kickoffPointsRef.value[wellNumber - 1].pky = targetKickOffData.pky;
  })
  
  eventBus.on('updateCurvesData', (data) => {
    let {index, pkx, pky, pkz} = data;
    kickoffPointsRef.value[index].pkx = pkx;
    kickoffPointsRef.value[index].pky = pky;
  })
}
