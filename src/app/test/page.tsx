'use client'

import { useState } from 'react'

export default function TestPage() {
  const [formData, setFormData] = useState({
    dietaryPreferences: [] as string[]
  })

  return (
    <main style={{ minHeight: '100vh', background: '#f9f9f9', padding: '2rem' }}>
      <h1>Test Dietary Preferences</h1>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#1a3a2a',
          marginBottom: '0.5rem'
        }}>
          Dietary Preferences & Restrictions
        </label>
        <p style={{
          fontSize: '0.8rem',
          color: '#666',
          marginBottom: '1rem'
        }}>
          Select your dietary preferences and restrictions to personalize recipe suggestions.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem'
        }}>
          {[
            'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 'Dairy-Free',
            'Nut-Free', 'Egg-Free', 'Soy-Free', 'Low-Carb', 'Keto',
            'Paleo', 'Mediterranean', 'Halal', 'Kosher', 'Low-Sodium',
            'High-Protein', 'Low-FODMAP', 'Whole30'
          ].map((preference) => (
            <label key={preference} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.9rem'
            }}>
              <input
                type="checkbox"
                checked={formData.dietaryPreferences.includes(preference)}
                onChange={(e) => {
                  const newPreferences = e.target.checked
                    ? [...formData.dietaryPreferences, preference]
                    : formData.dietaryPreferences.filter(p => p !== preference);
                  setFormData({ ...formData, dietaryPreferences: newPreferences });
                }}
                style={{ marginRight: '0.5rem' }}
              />
              {preference}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2>Selected Preferences:</h2>
        <p>{formData.dietaryPreferences.join(', ') || 'None selected'}</p>
      </div>
    </main>
  )
}
