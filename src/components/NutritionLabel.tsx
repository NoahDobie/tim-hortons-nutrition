import React from 'react';
import { NutritionData } from '../types';
import { calculateDV, DV } from '../lib/nutritionUtils';

interface NutritionLabelProps {
  data: NutritionData;
  servingSizeLabel?: string;
}

export const NutritionLabel: React.FC<NutritionLabelProps> = ({ data, servingSizeLabel = "1 serving" }) => {
  const formatValue = (val: number) => Number(val.toFixed(1)).toString();

  return (
    <div id="nutrition-label" className="bg-white p-4 border-2 border-black w-full max-w-[320px] font-sans text-sm inline-block">
      <div className="border-b-8 border-black pb-1 mb-1">
        <h2 className="text-2xl font-black leading-tight">Nutrition Facts</h2>
        <h3 className="text-xl font-bold leading-tight italic">Valeur nutritive</h3>
      </div>
      
      <div className="border-b border-black py-1">
        <p className="text-xs">Per 1 serving / par 1 portion</p>
        {servingSizeLabel !== "1 serving" && (
          <p className="text-xs italic">({servingSizeLabel})</p>
        )}
      </div>

      <div className="border-b-8 border-black py-1 flex justify-between items-end">
        <div>
          <p className="font-bold text-base leading-none">Calories</p>
        </div>
        <p className="font-bold text-2xl leading-none">{Math.round(data.calories)}</p>
      </div>

      <div className="text-right border-b border-black py-0.5">
        <p className="text-[10px] font-bold">% Daily Value*</p>
        <p className="text-[10px] font-bold italic">% valeur quotidienne*</p>
      </div>

      <div className="border-b border-black py-1 flex justify-between">
        <div>
          <span className="font-bold">Fat / Lipides</span> {formatValue(data.fat)} g
        </div>
        <div className="font-bold">{calculateDV(data.fat, DV.FAT)} %</div>
      </div>

      <div className="border-b border-black py-1 pl-4 flex justify-between">
        <div>
          Saturated / saturés {formatValue(data.saturatedFat)} g
          <br />
          + Trans / trans {formatValue(data.transFat)} g
        </div>
        <div className="font-bold">{calculateDV(data.saturatedFat + data.transFat, DV.SAT_TRANS_FAT)} %</div>
      </div>

      <div className="border-b border-black py-1 flex justify-between">
        <div>
          <span className="font-bold">Carbohydrate / Glucides</span> {formatValue(data.carbohydrates)} g
        </div>
        <div className="font-bold">{calculateDV(data.carbohydrates, DV.CARBS)} %</div>
      </div>

      <div className="border-b border-black py-1 pl-4 flex justify-between">
        <div>Fibre / Fibres {formatValue(data.fibre)} g</div>
        <div className="font-bold">{calculateDV(data.fibre, DV.FIBRE)} %</div>
      </div>

      <div className="border-b border-black py-1 pl-4 flex justify-between">
        <div>Sugars / Sucres {formatValue(data.sugars)} g</div>
        <div className="font-bold">{calculateDV(data.sugars, DV.SUGARS)} %</div>
      </div>

      <div className="border-b border-black py-1">
        <span className="font-bold">Protein / Protéines</span> {formatValue(data.protein)} g
      </div>

      <div className="border-b border-black py-1">
        <span className="font-bold">Cholesterol / Cholestérol</span> {Math.round(data.cholesterol)} mg
      </div>

      <div className="border-b-4 border-black py-1 flex justify-between">
        <div>
          <span className="font-bold">Sodium</span> {Math.round(data.sodium)} mg
        </div>
        <div className="font-bold">{calculateDV(data.sodium, DV.SODIUM)} %</div>
      </div>

      <div className="pt-2 text-[9px] leading-tight">
        <p>* 5% or less is <span className="font-bold">a little</span>, 15% or more is <span className="font-bold">a lot</span></p>
        <p className="italic">* 5% ou moins c'est <span className="font-bold">peu</span>, 15% ou plus c'est <span className="font-bold">beaucoup</span></p>
      </div>
    </div>
  );
};
