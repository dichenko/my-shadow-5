import Link from 'next/link';

export default function LevelsList() {
  return (
    <div className="levels-container">
      <div className="header">
        <h1>Let's Play</h1>
        <p>Be the first!</p>
      </div>

      <div className="levels-list">
        <Link href="/questions" className="level-card level-1">
          <div className="level-content">
            <div className="level-label">level 1</div>
            <div className="level-title">Travel newbie</div>
          </div>
          <div className="level-icon">
            <div className="suitcases">
              <span className="suitcase pink"></span>
              <span className="suitcase green"></span>
              <span className="suitcase yellow"></span>
            </div>
          </div>
        </Link>

        <Link href="/questions" className="level-card level-2">
          <div className="level-content">
            <div className="level-label">level 2</div>
            <div className="level-title">Continuing</div>
          </div>
          <div className="level-icon">
            <div className="balloon">
              <div className="balloon-inner"></div>
              <div className="clouds">
                <span className="cloud"></span>
                <span className="cloud"></span>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/questions" className="level-card level-3">
          <div className="level-content">
            <div className="level-label">level 3</div>
            <div className="level-title">Experienced</div>
          </div>
          <div className="level-icon">
            <div className="travel-items">
              <span className="globe"></span>
              <span className="camera"></span>
              <span className="photos"></span>
            </div>
          </div>
        </Link>
      </div>

      <style jsx>{`
        .levels-container {
          padding: 1.5rem;
          padding-bottom: 5rem;
        }

        .header {
          margin-bottom: 2rem;
        }

        .header h1 {
          font-size: 2.5rem;
          font-weight: bold;
          color: #FF6B8B;
          margin-bottom: 0.5rem;
        }

        .header p {
          font-size: 1rem;
          color: var(--tg-theme-hint-color);
        }

        .levels-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .level-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-radius: 20px;
          text-decoration: none;
          color: white;
          transition: transform 0.2s;
          min-height: 100px;
        }

        .level-card:hover {
          transform: translateY(-2px);
        }

        .level-1 {
          background: linear-gradient(135deg, #FF6B8B 0%, #FF8E9E 100%);
        }

        .level-2 {
          background: linear-gradient(135deg, #4A90E2 0%, #6BA5E7 100%);
        }

        .level-3 {
          background: linear-gradient(135deg, #9B6B9E 0%, #B37FB6 100%);
        }

        .level-content {
          flex: 1;
        }

        .level-label {
          text-transform: lowercase;
          font-size: 0.9rem;
          opacity: 0.9;
          margin-bottom: 0.25rem;
        }

        .level-title {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .level-icon {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Иконки для уровней */
        .suitcases {
          position: relative;
          width: 60px;
          height: 60px;
        }

        .suitcase {
          position: absolute;
          width: 30px;
          height: 25px;
          border-radius: 5px;
          transform: rotate(-15deg);
        }

        .suitcase.pink {
          background: #FFD9E4;
          top: 0;
          left: 0;
        }

        .suitcase.green {
          background: #D4FFE4;
          top: 15px;
          left: 15px;
        }

        .suitcase.yellow {
          background: #FFF5D4;
          top: 30px;
          left: 30px;
        }

        .balloon {
          position: relative;
          width: 60px;
          height: 60px;
        }

        .balloon-inner {
          width: 40px;
          height: 50px;
          background: #FFD700;
          border-radius: 50%;
          position: relative;
        }

        .clouds {
          position: absolute;
          bottom: -10px;
          left: 0;
          right: 0;
        }

        .cloud {
          position: absolute;
          width: 20px;
          height: 10px;
          background: white;
          border-radius: 10px;
        }

        .cloud:first-child {
          left: 10px;
        }

        .cloud:last-child {
          right: 10px;
        }

        .travel-items {
          position: relative;
          width: 60px;
          height: 60px;
        }

        .globe {
          position: absolute;
          width: 30px;
          height: 30px;
          background: #98FB98;
          border-radius: 50%;
          top: 0;
          left: 0;
        }

        .camera {
          position: absolute;
          width: 25px;
          height: 20px;
          background: #FFD700;
          border-radius: 5px;
          bottom: 0;
          right: 0;
        }

        .photos {
          position: absolute;
          width: 20px;
          height: 25px;
          background: white;
          border-radius: 3px;
          bottom: 10px;
          left: 10px;
          transform: rotate(-10deg);
        }
      `}</style>
    </div>
  );
} 