//  NOT SURE THIS WILL BE USED YET. IT NEEDS SOME TESTING TO MAKE SURE IT WORKS
// export class EveryXMonthSchedule extends Schedule {
//     constructor(monthIval, startDate, endDate) {
//         super();
//         this.frequencyPerMonth = monthIval;
//         this.startDate = newMoment(startDate);
//         this.monthDay = Math.min(30,this.startDate.date())
//         this.endDate = endDate? newMoment(endDate) : null;
//     }
//     getOccurrencesBetween(date,end) {
//         date = newMoment(date)
//         end = newMoment(end)
//         if (end.isBefore(this.startDate) || this.endDate?.isBefore(date)) return [];
//         if (date.isBefore(this.startDate)) date = this.startDate;
//         if (this.endDate && this.endDate.isBefore(end)) end = this.endDate;
//         let occurrences = [];
//         // If our start date month day is before the recurring monthdate,
//         // bump it up. If it is after, bump it to the next month
//         if (date.date() > this.monthDay) date.add(1, "M")
//         date.date(this.monthDay);
//         // If our start date does not fall on an interval month,
//         // bump it up to the next one.
//         let offset = day2.diff(start, 'M')%this.monthIval
//         if (offset !== 0) day2.add(this.monthIval-offset, 'M')
//         // For every month between start and end
//         while (date.isSameOrBefore(end)) {
//             occurrences.push(newMoment(date));
//             date = date.add(this.monthIval, 'M')
//         }
//         return occurrences;
//     }
// }


export enum TransactionType {
    "Income",
    "Expense",
    "Transfer"
}
