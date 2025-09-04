
import React from 'react';
import { BookOpenText, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t border-border/40 mt-auto">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <BookOpenText className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
              EduHorizon LMS
            </span>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-6 text-xs">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Courses</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
              <Facebook size={16} />
            </a>
            <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter size={16} />
            </a>
            <a href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
              <Linkedin size={16} />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-3 pt-3 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} EduHorizon LMS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
  
