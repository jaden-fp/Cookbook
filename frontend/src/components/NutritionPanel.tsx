import { useState } from 'react';
import type { IngredientGroup } from '../types';
import { calcNutrition, parseServings, getNutritionBadges } from '../utils/nutritionCalc';
import type { NutrientPer100g } from '../utils/nutritionData';

interface Props {
  ingredientGroups: IngredientGroup[];
  yieldStr?: string | null;
  scale: number;
}

interface NutrientBarProps {
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
}

function NutrientBar({ label, value, unit, max, color }: NutrientBarProps) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ height: '6px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '99px',
            background: color,
            transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>
    </div>
  );
}

// Reference daily values (for % bar context)
const DAILY: NutrientPer100g = {
  calories: 2000,
  protein: 50,
  fat: 65,
  sugar: 50,
  carbs: 275,
};

export default function NutritionPanel({ ingredientGroups, yieldStr, scale }: Props) {
  const defaultServings = parseServings(yieldStr);
  const [servings, setServings] = useState<number>(defaultServings);
  const [showTotal, setShowTotal] = useState(false);

  const result = calcNutrition(ingredientGroups, servings, scale);
  const display = showTotal ? result.total : result.perServing;
  const badges = getNutritionBadges(result.perServing);

  const hasData = result.coveragePercent > 0;

  return (
    <div className="animate-fade-up space-y-4">

      {/* Servings control */}
      <div
        className="flex items-center justify-between rounded-2xl p-4"
        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
      >
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1px' }}>
            Servings
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {yieldStr ? `Recipe yields ${yieldStr}` : 'Set your serving count'}
          </p>
        </div>

        <div className="flex items-center" style={{ border: '1.5px solid var(--border-strong)', borderRadius: '999px', overflow: 'hidden', background: 'var(--surface)' }}>
          <button
            onClick={() => setServings(s => Math.max(1, s - 1))}
            className="flex items-center justify-center transition-colors duration-150"
            style={{ width: '2rem', height: '2rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor"><rect width="10" height="2" rx="1"/></svg>
          </button>
          <div style={{ width: '1px', height: '1.25rem', background: 'var(--border-strong)' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', minWidth: '32px', textAlign: 'center', userSelect: 'none', padding: '0 4px' }}>
            {servings}
          </span>
          <div style={{ width: '1px', height: '1.25rem', background: 'var(--border-strong)' }} />
          <button
            onClick={() => setServings(s => Math.min(100, s + 1))}
            className="flex items-center justify-center transition-colors duration-150"
            style={{ width: '2rem', height: '2rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <rect x="4" width="2" height="10" rx="1"/><rect y="4" width="10" height="2" rx="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Nutrition card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #D94E7A 100%)',
            padding: '20px 20px 16px',
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                Nutrition Facts
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 700, color: 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {display.calories}
                <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '4px', opacity: 0.8 }}>kcal</span>
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>
                {showTotal ? 'Entire recipe' : `Per serving (÷${servings})`}
              </p>
            </div>

            {/* Toggle per serving / total */}
            <button
              onClick={() => setShowTotal(t => !t)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '999px',
                padding: '5px 10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(4px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            >
              {showTotal ? 'Per serving' : 'Total'}
            </button>
          </div>
        </div>

        {/* Macros */}
        <div className="p-5 space-y-4">
          {hasData ? (
            <>
              <NutrientBar
                label="Fat"
                value={display.fat}
                unit="g"
                max={showTotal ? DAILY.fat * servings : DAILY.fat}
                color="#E9557A"
              />
              <NutrientBar
                label="Carbohydrates"
                value={display.carbs}
                unit="g"
                max={showTotal ? DAILY.carbs * servings : DAILY.carbs}
                color="#C47C2B"
              />
              <NutrientBar
                label="Sugar"
                value={display.sugar}
                unit="g"
                max={showTotal ? DAILY.sugar * servings : DAILY.sugar}
                color="#A855C7"
              />
              <NutrientBar
                label="Protein"
                value={display.protein}
                unit="g"
                max={showTotal ? DAILY.protein * servings : DAILY.protein}
                color="#3DAD6B"
              />

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  * Based on {result.coveragePercent}% ingredient match · Bars show % of reference daily intake
                  {scale !== 1 && ` · ${scale}× scale applied`}
                </p>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                No nutrition data available for these ingredients.
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Try adding more specific ingredient names.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      {hasData && badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map(b => (
            <span
              key={b.label}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: b.color,
                background: `${b.color}18`,
                border: `1.5px solid ${b.color}40`,
                borderRadius: '999px',
                padding: '4px 10px',
              }}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Ingredient breakdown (collapsed by default) */}
      {hasData && (
        <details
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
        >
          <summary
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text)',
              padding: '14px 16px',
              cursor: 'pointer',
              listStyle: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Ingredient breakdown</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4l4 4 4-4"/>
            </svg>
          </summary>

          <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px 16px' }}>
            <div className="space-y-1.5">
              {result.breakdown.map((item, i) => (
                <div key={i} className="flex items-baseline justify-between gap-2">
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8125rem',
                    color: item.matched ? 'var(--text)' : 'var(--text-muted)',
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.matched ? '' : '⚠ '}{item.name}
                  </span>
                  {item.matched ? (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {item.nutrition.calories} kcal
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      not matched
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
