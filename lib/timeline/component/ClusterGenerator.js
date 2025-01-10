import ClusterItem from './item/ClusterItem';

const UNGROUPED = '__ungrouped__';   // reserved group id for ungrouped items
const BACKGROUND = '__background__'; // reserved group id for background items without group

export const ReservedGroupIds = {
  UNGROUPED,
  BACKGROUND
}

/**
 * An Cluster generator generates cluster items
 */
export default class ClusterGenerator {
    /**
     * @param {ItemSet} itemSet itemsSet instance
     * @constructor ClusterGenerator
    */
    constructor(itemSet) {
        this.itemSet = itemSet;
        this.groups = {};
        this.cache = {};
        this.cache[-1] = [];
    }

    /**
     * @param {Object} itemData             Object containing parameters start content, className.
     * @param {{toScreen: function, toTime: function}} conversion
     *                                  Conversion functions from time to screen and vice versa
     * @param {Object} [options]        Configuration options
     * @return {Object} newItem
    */
    createClusterItem(itemData, conversion, options) {
        const newItem = new ClusterItem(itemData, conversion, options);
        return newItem;
    }

    /**
     * Set the items to be clustered.
     * This will clear cached clusters.
     * @param {Item[]} items
     * @param {Object} [options]  Available options:
     *                            {boolean} applyOnChangedLevel
     *                                If true (default), the changed data is applied
     *                                as soon the cluster level changes. If false,
     *                                The changed data is applied immediately
     */
    setItems(items, options) {
        this.items = items || [];
        this.dataChanged = true;
        this.applyOnChangedLevel = false;

        if (options && options.applyOnChangedLevel) {
            this.applyOnChangedLevel = options.applyOnChangedLevel;
        }
    }

    /**
     * Update the current data set: clear cache, and recalculate the clustering for
     * the current level
     */
    updateData() {
        this.dataChanged = true;
        this.applyOnChangedLevel = false;
    }

    /**
     * Cluster the items which are too close together
     * @param {array} oldClusters 
     * @param {number} scale      The scale of the current window : (windowWidth / (endDate - startDate)) 
     * @param {{maxItems: number, clusterCriteria: function, titleTemplate: string}} options             
     * @return {array} clusters
    */
    getClusters(oldClusters, scale, options) {
        let { maxItems, clusterCriteria } = typeof options === "boolean" ? {} : options;
    
        if (!clusterCriteria) {
            clusterCriteria = () => true;
        }

        maxItems = maxItems || 1;

        let level = -1;
        let granularity = 2;
        let timeWindow = 0;

        if (scale > 0) {
            if (scale >= 1) {
                return [];
            }

            level = Math.abs(Math.round(Math.log(100 / scale) / Math.log(granularity)));
            timeWindow = Math.abs(Math.pow(granularity, level));
        }

        // clear the cache when and re-generate groups the data when needed.
        if (this.dataChanged) {
            const levelChanged = (level != this.cacheLevel);
            const applyDataNow = this.applyOnChangedLevel ? levelChanged : true;
            if (applyDataNow) {
                this._dropLevelsCache();
                this._filterData();
            }
        }

        this.cacheLevel = level;
        let clusters = this.cache[level];
        if (!clusters) {
            clusters = [];
            for (let groupName in this.groups) {
                if (Object.prototype.hasOwnProperty.call(this.groups, groupName)) {
                    const items = this.groups[groupName];
                    const iMax = items.length;
                    let i = 0;
                    while (i < iMax) {
                        // find all items around current item, within the timeWindow
                        let item = items[i];
                        let neighbors = 1; // start at 1, to include itself)

                        // loop through items left from the current item
                        let j = i - 1;
                        while (j >= 0 && (item.center - items[j].center) < timeWindow / 2) {
                            if (!items[j].cluster && clusterCriteria(item.data, items[j].data)) {
                                neighbors++;
                            }
                            j--;
                        }

                        // loop through items right from the current item
                        let k = i + 1;
                        while (k < items.length && (items[k].center - item.center) < timeWindow / 2) {
                            if (clusterCriteria(item.data, items[k].data)) {
                                neighbors++;
                            }
                            k++;
                        }

                        // loop through the created clusters
                        let l = clusters.length - 1;
                        while (l >= 0 && (item.center - clusters[l].center) < timeWindow) {
                            if (item.group == clusters[l].group && clusterCriteria(item.data, clusters[l].data)) {
                                neighbors++;
                            }
                            l--;
                        }

                        // aggregate until the number of items is within maxItems
                        if (neighbors > maxItems) {
                            // too busy in this window.
                            const num = neighbors - maxItems + 1;
                            const clusterItems = [];

                            // append the items to the cluster,
                            // and calculate the average start for the cluster
                            let m = i;
                            while (clusterItems.length < num && m < items.length) {
                                if (clusterCriteria(items[i].data, items[m].data)) {
                                    clusterItems.push(items[m]);
                                }
                                m++;
                            }

                            const groupId = this.itemSet.getGroupId(item.data);
                            const group = this.itemSet.groups[groupId] || this.itemSet.groups[ReservedGroupIds.UNGROUPED];
                            let cluster = this._getClusterForItems(clusterItems, group, oldClusters, options);
                            clusters.push(cluster);

                            i += num;
                        } else {
                            delete item.cluster;
                            i += 1;
                        }
                    }
                }
            }

            this.cache[level] = clusters;
        }

        return clusters;
    }

    /**
     * Filter the items per group.
     * @private
     */
    _filterData() {
        // filter per group
        const groups = {};
        this.groups = groups;

        // split the items per group
        for (const item of Object.values(this.items)) {
            // put the item in the correct group
            const groupName = item.parent ? item.parent.groupId : '';
            let group = groups[groupName];
            if (!group) {
                group = [];
                groups[groupName] = group;
            }
            group.push(item);

            // calculate the center of the item
            if (item.data.start) {
                if (item.data.end) {
                    // range
                    item.center = (item.data.start.valueOf() + item.data.end.valueOf()) / 2;
                } else {
                    // box, dot
                    item.center = item.data.start.valueOf();
                }
            }
        }

        // sort the items per group
        for (let currentGroupName in groups) {
            if (Object.prototype.hasOwnProperty.call(groups, currentGroupName)) {
                groups[currentGroupName].sort((a, b) => a.center - b.center);
            }
        }

        this.dataChanged = false;
    }

    /**
     * Create new cluster or return existing
     * @private
     * @param {array} clusterItems    
     * @param {object} group 
     * @param {array} oldClusters 
     * @param {object} options 
     * @returns {object} cluster
     */
    _getClusterForItems(clusterItems, group, oldClusters, options) {
        const oldClustersLookup = (oldClusters || []).map(cluster => ({
            cluster,
            itemsIds: new Set(cluster.data.uiItems.map(item => item.id))
        }));
        let cluster;
        if (oldClustersLookup.length) {
            for (let oldClusterData of oldClustersLookup) {
                if (oldClusterData.itemsIds.size === clusterItems.length 
                    && clusterItems.every(clusterItem => oldClusterData.itemsIds.has(clusterItem.id))) {
                    cluster = oldClusterData.cluster;
                    break;
                }
            }
        }

        if (cluster) {
            cluster.setUiItems(clusterItems);
            if (cluster.group !== group) {
                if (cluster.group) {
                    cluster.group.remove(cluster);    
                }

                if (group) {
                    group.add(cluster);    
                    cluster.group = group;
                }
            }
            return cluster;
        }

        let titleTemplate = options.titleTemplate || '';
        const conversion = {
            toScreen: this.itemSet.body.util.toScreen,
            toTime: this.itemSet.body.util.toTime
        };

        const title = titleTemplate.replace(/{count}/, clusterItems.length);
        const clusterContent = '<div title="' + title + '">' + clusterItems.length + '</div>';
        const clusterOptions = Object.assign({}, options, this.itemSet.options);
        const data = {
            'content': clusterContent,
            'title': title,
            'group': group,
            'uiItems': clusterItems,
            'eventEmitter': this.itemSet.body.emitter,
            'range': this.itemSet.body.range
        };
        cluster = this.createClusterItem(data,
        conversion,
        clusterOptions);

        if (group) {
            group.add(cluster);
            cluster.group = group;
        }

        cluster.attach();

        return cluster;
    }

    /**
     * Drop cache
     * @private
     */
    _dropLevelsCache() {
        this.cache = {};
        this.cacheLevel = -1;
        this.cache[this.cacheLevel] = [];
    }
}
