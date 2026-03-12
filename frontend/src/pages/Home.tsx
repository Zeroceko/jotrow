import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

export default function Home() {
  return (
    <Layout>
      <h1>Notlar Burada</h1>
      <p>Fotoğraftan temiz ders notu</p>
      <div style={{ marginTop: '20px' }}>
        <Link to="/login">
          <button>Giriş Yap</button>
        </Link>
        <Link to="/register" style={{ marginLeft: '10px' }}>
          <button>Kayıt Ol</button>
        </Link>
      </div>

      <h2 style={{ marginTop: '40px' }}>Öne Çıkan Özellikler</h2>
      <div className="grid" style={{ marginTop: '20px' }}>
        <div className="card">Çoklu fotoğraf yükleme</div>
        <div className="card">Ders bazlı organizasyon</div>
        <div className="card">Profil paylaşımı</div>
        <div className="card">4 haneli erişim kodu</div>
      </div>
    </Layout>
  )
}
