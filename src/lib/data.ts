import { DataRow, AggregationType } from '../types';

export function aggregateData(
  data: DataRow[],
  groupByKeys: string[],
  valueKeys: string[],
  type: AggregationType
): any[] {
  const groupKey = groupByKeys.join(' - ');

  if (type === 'none') {
    return data.map(row => {
      const groupVal = groupByKeys.map(key => row[key]).join(' - ');
      const result: any = { [groupKey]: groupVal };
      valueKeys.forEach(key => {
        result[key] = row[key];
      });
      return result;
    });
  }

  const groups: { [key: string]: { [key: string]: number[] } } = {};

  data.forEach(row => {
    const groupVal = groupByKeys.map(key => String(row[key])).join(' - ');
    if (!groups[groupVal]) {
      groups[groupVal] = {};
      valueKeys.forEach(key => {
        groups[groupVal][key] = [];
      });
    }
    valueKeys.forEach(key => {
      const val = parseFloat(row[key]);
      if (!isNaN(val)) {
        groups[groupVal][key].push(val);
      }
    });
  });

  return Object.entries(groups).map(([groupVal, values]) => {
    const result: any = { [groupKey]: groupVal };
    valueKeys.forEach(key => {
      const vals = values[key];
      if (vals.length === 0) {
        result[key] = 0;
        return;
      }

      switch (type) {
        case 'sum':
          result[key] = vals.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          result[key] = vals.reduce((a, b) => a + b, 0) / vals.length;
          break;
        case 'min':
          result[key] = Math.min(...vals);
          break;
        case 'max':
          result[key] = Math.max(...vals);
          break;
        case 'count':
          result[key] = vals.length;
          break;
        default:
          result[key] = 0;
      }
    });
    return result;
  });
}
