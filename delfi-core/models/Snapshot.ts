/** A structure that holds all computed transactions for easy access */
//  UNFINISHED!!!
// export class Forecast {
//     map;
//     list;
//     NearestUnder;
//     NearestAbove;
//     array;
//     constructor() {
//         this.map = new Map(); // <id, idx>
//         this.list = [];
//         this.NearestUnder = "NearestUnder"
//         this.NearestAbove = "NearestAbove"
//     }
//     addNextInOrder(snapshot) {
//         this.array.push(snapshot);
//         this.map.set(snapshot.id, this.array.length-1)
//     }
//     getById(id) {
//         return this.array[this.map.get(id)];
//     }
// 
// getSnapshotAtDate(date) {
//     date = newMoment(date);
//     this.findNearDate(date, this.NearestUnder)
// }
// findNearDate(date, mode) {
//     function helper (low, high) {
//         if (low > high) {
//             return null
//         }
//         let middle = Math.floor((low + high) / 2)
//         const snapshot = this.array[middle];
//         if (snapshot.event.date.isSame(date)) {
//            return snapshot;
//         }
//         if (mode === this.NearestUnder) {
//             if (snapshot.date.isBefore(date)) {
//                 return helper(middle + 1, high)
//             }
//             return helper(low, middle - 1)
//         }
//     }
//     return helper(0, arr.length - 1)
//     getHigher
//     if (!idx) idx = Math.floor(this.array.length/2)
//     let snapshot = this.array[idx];
//     if (snapshot.event.date.isSame(date)) return snapshot;
//     if (mode == this.NearestUnder) {
//         if (snapshot.date.isAfter(date)) {
//             if (idx === this.array.length) {
//                 return null
//             }
//         }
//         else {
//             let greater
//         }
//     }
// }
// }

export class Snapshot {
    constructor(public balances, public mostRecentEvent) {
    }
}
