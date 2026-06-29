import { Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060f1c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        gap: 24,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 800, color: '#e43c44', lineHeight: 1 }}>404</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e8edf2', margin: 0 }}>
        Página não encontrada
      </h1>
      <p style={{ fontSize: 15, color: '#4a6f93', maxWidth: 380, margin: 0 }}>
        A página que você está procurando não existe ou foi movida. Volte para o início e encontre os melhores pacotes de experiências.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#e43c44', color: '#000', fontWeight: 700, fontSize: 14,
            padding: '12px 24px', borderRadius: 40, textDecoration: 'none',
            transition: 'opacity .2s',
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = '.85')}
          onMouseOut={e => (e.currentTarget.style.opacity = '1')}
        >
          <Home size={15} /> Página Inicial
        </Link>
        <button
          onClick={() => window.history.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'transparent', color: '#7bc4e8', fontWeight: 600, fontSize: 14,
            padding: '12px 24px', borderRadius: 40, border: '1px solid #1a3150',
            cursor: 'pointer', transition: 'border-color .2s',
          }}
          onMouseOver={e => (e.currentTarget.style.borderColor = '#e43c44')}
          onMouseOut={e => (e.currentTarget.style.borderColor = '#1a3150')}
        >
          <ArrowLeft size={15} /> Voltar
        </button>
      </div>
    </div>
  );
}
