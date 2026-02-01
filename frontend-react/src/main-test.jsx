import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Simple test component
function TestApp() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '20px'
        }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>🚀 React is Working!</h1>
            <p style={{ fontSize: '24px', marginBottom: '40px' }}>SmartHostel Frontend</p>
            <button
                onClick={() => window.location.href = '/login'}
                style={{
                    background: 'linear-gradient(to right, #3b82f6, #9333ea)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer'
                }}
            >
                Go to Login
            </button>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <TestApp />
    </React.StrictMode>,
)
