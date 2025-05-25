import { create } from "zustand";

type NutriState = {
  macros: MacroInfo;
  addMacros: (macro: MacroInfo) => void; //increase Macros
  clearMacros: () => void;
  setMacros: (macro: MacroInfo) => void;
};

export interface MacroInfo {
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  sugar: number;
}

export const useMacroStore = create<NutriState>((set) => ({
  macros: {
    calories: 0,
    carbohydrates: 0,
    protein: 0,
    fat: 0,
    sugar: 0,
  }, // initial value

  addMacros: (
    macro: Partial<MacroInfo> //use addMacros({ calories: 10 }) also works
  ) =>
    set((state) => ({
      macros: {
        calories: state.macros.calories + (macro.calories ?? 0),
        carbohydrates: state.macros.carbohydrates + (macro.carbohydrates ?? 0),
        protein: state.macros.protein + (macro.protein ?? 0),
        fat: state.macros.fat + (macro.fat ?? 0),
        sugar: state.macros.sugar + (macro.sugar ?? 0),
      },
    })),

  clearMacros: () =>
    //reset day intake
    set((state) => ({
      macros: {
        calories: 0,
        carbohydrates: 0,
        protein: 0,
        fat: 0,
        sugar: 0,
      },
    })),

  setMacros: (macro: MacroInfo) => {
    macros: macro;
  }, //set from startup from DB
}));
