import React from "react";
import "./Navbar.css";

export default function Navbar() {
  const [hoverName, setHoverName] = React.useState(false);
  const [hoverIcon, setHoverIcon] = React.useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          PDF Q&A Learning App
        </div>
        <div className={`navbar-right${hoverName ? ' name-hover' : ''}${hoverIcon ? ' icon-hover' : ''}`}>
          <a
            href="https://www.linkedin.com/in/muhammadahtasham/"
            target="_blank"
            rel="noopener noreferrer"
            className={`icon-wrapper${hoverIcon ? ' icon-hover' : ''}`}
            title="LinkedIn"
            onMouseEnter={() => setHoverIcon(true)}
            onMouseLeave={() => setHoverIcon(false)}
          >
            <div 
              className="shimmer"
              style={{ left: hoverIcon ? "100%" : "-100%" }}
            />
            <svg 
              className={`icon${hoverIcon ? ' icon-hover-color' : ''}`}
              xmlns="http://www.w3.org/2000/svg" 
              width="22" 
              height="22" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 8a6 6 0 0 1 6 6v6"/>
              <line x1="8" y1="11" x2="8" y2="16"/>
              <line x1="8" y1="8" x2="8" y2="8"/>
            </svg>
          </a>
          <a
            href="https://atiiisham.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className={`name${hoverName ? ' name-hover' : ''}`}
            onMouseEnter={() => setHoverName(true)}
            onMouseLeave={() => setHoverName(false)}
          >
            <div 
              className="shimmer"
              style={{ left: hoverName ? "100%" : "-100%" }}
            />
            Muhammad Ahtasham
          </a>
        </div>
      </div>
    </nav>
  );
}