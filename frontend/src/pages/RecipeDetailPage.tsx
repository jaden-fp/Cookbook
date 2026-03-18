import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRecipe } from '../api';
import type { Recipe } from '../types';
import StarDisplay from '../components/StarDisplay';
import BakedModal from '../components/BakedModal';
import CookbookModal from '../components/CookbookModal';
import { scaleAmount } from '../utils/scaleAmount';

type Tab = 'ingredients' | 'instructions';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('ingredients');
  const [scale, setScale] = useState(1);
  const [showBaked, setShowBaked] = useState(false);
  const [showCookbook, setShowCookbook] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRecipe(parseInt(id))
      .then(setRecipe)
      .finally(() => setLoading(false));
  }, [id]);

  function adjustScale(delta: number) {
    setScale(s => Math.max(0.5, Math.min(10, parseFloat((s + delta).toFixed(2)))));
  }

  const scaleLabel = Number.isInteger(scale) ? `${scale}×` : `${scale}×`;

  if (loading) {
    return (
      <div>
        <div className="skeleton w-full" style={{ height: '50vh' }} />
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
          <div className="skeleton h-10 w-2/3 rounded-xl" />
          <div className="skeleton h-4 w-full rounded-lg" />
          <div className="skeleton h-4 w-5/6 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p style={{ color: 'var(--color-bark-muted)' }}>Recipe not found.</p>
        <Link to="/recipes" className="text-sm mt-2 inline-block" style={{ color: 'var(--color-terra)' }}>
          All Recipes
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Hero ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '52vh', minHeight: 280, maxHeight: 540 }}
      >
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, var(--color-bark) 0%, var(--color-bark-mid) 60%, #7A4020 100%)',
            }}
          />
        )}
        <div className="hero-gradient absolute inset-0" />

        {/* Title overlaid on hero */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-7 max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mb-3">
            <Link
              to="/recipes"
              className="text-xs font-medium transition-colors duration-200"
              style={{ color: 'rgba(250,247,242,0.6)', fontFamily: 'var(--font-body)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(250,247,242,0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(250,247,242,0.6)'; }}
            >
              All Recipes
            </Link>
            <span style={{ color: 'rgba(250,247,242,0.4)', fontSize: '0.75rem' }}>/</span>
          </div>
          <h1
            className="text-white animate-fade-up"
            style={{
              fontFamily: 'var(--font-editorial)',
              fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              textShadow: '0 2px 16px rgba(0,0,0,0.4)',
            }}
          >
            {recipe.title}
          </h1>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        className="max-w-3xl mx-auto px-6 pb-20"
        style={{ marginTop: '-1px' }}
      >
        {/* White card section */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-6 shadow-warm-sm animate-fade-up"
          style={{
            background: 'white',
            border: '1px solid var(--color-warm-border-light)',
          }}
        >
          {/* Description */}
          {recipe.description && (
            <p
              className="mb-6 leading-relaxed"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-bark-mid)',
                fontSize: '1rem',
                lineHeight: 1.7,
              }}
            >
              {recipe.description}
            </p>
          )}

          {/* Meta stats */}
          {(recipe.prep_time || recipe.cook_time || recipe.yield) && (
            <div
              className="flex flex-wrap gap-0 rounded-xl overflow-hidden mb-6"
              style={{ border: '1px solid var(--color-warm-border-light)' }}
            >
              {[
                recipe.prep_time && { label: 'Prep Time', value: recipe.prep_time, icon: '⏱' },
                recipe.cook_time && { label: 'Cook Time', value: recipe.cook_time, icon: '🔥' },
                recipe.yield && { label: 'Yield', value: recipe.yield, icon: '🍽' },
              ]
                .filter(Boolean)
                .map((stat, i, arr) => stat && (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-center py-4 px-3 min-w-[80px]"
                    style={{
                      borderRight: i < arr.length - 1 ? `1px solid var(--color-warm-border-light)` : 'none',
                      background: i % 2 === 0 ? 'var(--color-cream)' : 'white',
                    }}
                  >
                    <span className="text-xl mb-1">{stat.icon}</span>
                    <span
                      className="text-xs font-medium uppercase tracking-wide block mb-0.5"
                      style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
                    >
                      {stat.label}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-bark)', fontFamily: 'var(--font-body)' }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))
              }
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {recipe.source_url && (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                style={{
                  border: '1.5px solid var(--color-warm-border)',
                  color: 'var(--color-bark-mid)',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-bark)'; e.currentTarget.style.color = 'var(--color-bark)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-warm-border)'; e.currentTarget.style.color = 'var(--color-bark-mid)'; }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit Website
              </a>
            )}

            <button
              onClick={() => setShowBaked(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={
                recipe.rating
                  ? {
                      background: 'var(--color-terra-muted)',
                      border: '1.5px solid rgba(196,98,45,0.25)',
                      color: 'var(--color-terra-dark)',
                      fontFamily: 'var(--font-body)',
                    }
                  : {
                      background: 'var(--color-terra)',
                      color: 'white',
                      fontFamily: 'var(--font-body)',
                      boxShadow: '0 2px 8px rgba(196,98,45,0.30)',
                    }
              }
              onMouseEnter={e => {
                if (!recipe.rating) e.currentTarget.style.background = 'var(--color-terra-dark)';
              }}
              onMouseLeave={e => {
                if (!recipe.rating) e.currentTarget.style.background = 'var(--color-terra)';
              }}
            >
              {recipe.rating ? (
                <>
                  <span>Baked ✓</span>
                  <StarDisplay rating={recipe.rating} size="sm" />
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Mark as Baked
                </>
              )}
            </button>

            <button
              onClick={() => setShowCookbook(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                border: '1.5px solid var(--color-warm-border)',
                color: 'var(--color-bark-mid)',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-forest)'; e.currentTarget.style.color = 'var(--color-forest)'; e.currentTarget.style.background = 'var(--color-forest-muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-warm-border)'; e.currentTarget.style.color = 'var(--color-bark-mid)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              + Cookbook
            </button>
          </div>
        </div>

        {/* ── Scaler ── */}
        <div
          className="flex items-center gap-3 mb-6 animate-fade-up delay-1"
        >
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
          >
            Scale
          </span>
          <div
            className="inline-flex items-center rounded-full overflow-hidden"
            style={{
              border: '1.5px solid var(--color-warm-border)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(44,26,14,0.06)',
            }}
          >
            <button
              onClick={() => adjustScale(-0.5)}
              className="flex items-center justify-center transition-colors duration-150"
              style={{
                width: '2.25rem',
                height: '2.25rem',
                color: 'var(--color-bark-mid)',
                fontSize: '1.1rem',
                fontWeight: 300,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-cream-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              −
            </button>
            <span
              className="text-sm font-medium text-center"
              style={{
                minWidth: '3rem',
                color: 'var(--color-bark)',
                fontFamily: 'var(--font-body)',
                borderLeft: '1px solid var(--color-warm-border-light)',
                borderRight: '1px solid var(--color-warm-border-light)',
                padding: '0.4rem 0.25rem',
              }}
            >
              {scaleLabel}
            </span>
            <button
              onClick={() => adjustScale(0.5)}
              className="flex items-center justify-center transition-colors duration-150"
              style={{
                width: '2.25rem',
                height: '2.25rem',
                color: 'var(--color-bark-mid)',
                fontSize: '1.1rem',
                fontWeight: 300,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-cream-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              +
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div
          className="mb-6 animate-fade-up delay-2"
          style={{ borderBottom: '1.5px solid var(--color-warm-border-light)' }}
        >
          <div className="flex gap-0">
            {(['ingredients', 'instructions'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative px-5 py-3 text-sm font-medium capitalize transition-colors duration-200 -mb-px"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: tab === t ? 'var(--color-terra)' : 'var(--color-bark-muted)',
                  borderBottom: tab === t ? '2px solid var(--color-terra)' : '2px solid transparent',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Ingredients tab ── */}
        {tab === 'ingredients' && (
          <div className="space-y-7 animate-fade-up">
            {recipe.ingredient_groups.map((group, gi) => (
              <div key={gi}>
                {group.group_name && (
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-xs font-medium uppercase tracking-[0.15em]"
                      style={{ color: 'var(--color-bark-muted)', fontFamily: 'var(--font-body)' }}
                    >
                      {group.group_name}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--color-warm-border-light)' }} />
                  </div>
                )}
                <ul className="space-y-2">
                  {group.ingredients.map((ing, ii) => (
                    <li key={ii} className="flex items-baseline gap-3">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: 'var(--color-terra)', opacity: 0.5 }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-bark)' }}>
                        <span
                          key={`${scale}-${gi}-${ii}`}
                          className="font-semibold animate-amount"
                          style={{ color: 'var(--color-bark)' }}
                        >
                          {[scaleAmount(ing.amount, scale), ing.unit].filter(Boolean).join(' ')}
                        </span>{' '}
                        {ing.name}
                        {ing.notes && (
                          <span
                            className="ml-1"
                            style={{ color: 'var(--color-bark-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}
                          >
                            ({ing.notes})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Equipment */}
            {recipe.equipment && recipe.equipment.length > 0 && (
              <div
                className="rounded-2xl p-5 mt-6"
                style={{
                  background: 'var(--color-forest-muted)',
                  border: '1px solid rgba(61,90,71,0.12)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ color: 'var(--color-forest)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                  <h3
                    className="text-xs font-medium uppercase tracking-[0.15em]"
                    style={{ color: 'var(--color-forest)', fontFamily: 'var(--font-body)' }}
                  >
                    Equipment
                  </h3>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {recipe.equipment.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--color-forest)', fontFamily: 'var(--font-body)' }}
                    >
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--color-forest-light)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Instructions tab ── */}
        {tab === 'instructions' && (
          <ol className="space-y-6 animate-fade-up">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-5">
                <div className="shrink-0 flex flex-col items-center">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{
                      background: 'var(--color-terra)',
                      fontFamily: 'var(--font-body)',
                      boxShadow: '0 2px 8px rgba(196,98,45,0.30)',
                    }}
                  >
                    {i + 1}
                  </span>
                  {i < recipe.instructions.length - 1 && (
                    <div
                      className="flex-1 w-px mt-2"
                      style={{ background: 'var(--color-warm-border-light)', minHeight: '1.5rem' }}
                    />
                  )}
                </div>
                <p
                  className="pb-2 leading-relaxed pt-1"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-bark-mid)',
                    fontSize: '0.9375rem',
                    lineHeight: 1.75,
                  }}
                >
                  {step}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {showBaked && (
        <BakedModal recipe={recipe} onClose={() => setShowBaked(false)} onSave={setRecipe} />
      )}
      {showCookbook && (
        <CookbookModal recipeId={recipe.id} onClose={() => setShowCookbook(false)} />
      )}
    </div>
  );
}
