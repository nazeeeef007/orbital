// import { create } from "zustand";
// import { mealApi } from "@/apis/mealApi";

// type NutriState = {
//   macros: MacroInfo;
//   addMacros: (meal: Meal) => void; //increase Macros
//   clearMacros: () => void;
//   // setMacros: (macro: MacroInfo) => void;
// };

// type Meal = {
//   calories: number;
//   carbohydrates: number;
//   protein: number;
//   fat: number;
//   sugar: number;
// }

// export interface MacroInfo { //MacroInfo of local user, remember to update DB after
//   meals: Meal[];
// }

// export const useMacroStore = create<NutriState>((set) => ({
//   macros: {
//     meals: [],
//   }, // initial value, 

//   addMacros: (
//     meal: Meal 
//   ) =>
//     set((state) => ({
//       macros: {
//         calories: state.macros.calories + (macro.calories ?? 0),
//         carbohydrates: state.macros.carbohydrates + (macro.carbohydrates ?? 0),
//         protein: state.macros.protein + (macro.protein ?? 0),
//         fat: state.macros.fat + (macro.fat ?? 0),
//         sugar: state.macros.sugar + (macro.sugar ?? 0),
//         meals: 
//       },
//     })),

//   clearMacros: () =>
//     //reset day intake
//     set((state) => ({
//       macros: {
//         calories: 0,
//         carbohydrates: 0,
//         protein: 0,
//         fat: 0,
//         sugar: 0,
//       },
//     })),

//   setMacros: (macro: MacroInfo) => {
//     macros: macro;
//   }, //set from startup from DB
// }));
