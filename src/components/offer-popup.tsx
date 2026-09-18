'use client';

import { useEffect, useState } from 'react';
import { X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfferPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if popup has been dismissed
    const hasSeenOffer = localStorage.getItem('schoolbase-offer-dismissed');
    if (!hasSeenOffer) {
      // Small delay to ensure smooth rendering
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('schoolbase-offer-dismissed', 'true');
  };

  if (!mounted || !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/50 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header with close button */}
          <div className="relative border-b border-gray-200 px-6 py-4 sm:px-8 sm:py-6">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close offer"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            {/* Main heading */}
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-gray-900">
              Pay for One Term.<br />
              <span className="text-blue-600">Get This Term and Next Term.</span>
            </h2>

            <p className="mt-4 text-lg text-gray-600 font-semibold">
              There's never been a better time to move your school to SchoolBase.
            </p>

            {/* Main offer text */}
            <div className="mt-6 space-y-4 text-gray-700">
              <p>
                Subscribe today and enjoy{' '}
                <strong className="text-gray-900">
                  the rest of this term at no extra cost
                </strong>
                . Your subscription will also cover{' '}
                <strong className="text-gray-900">
                  the entire next term
                </strong>
                , giving your school enough time to set up, train your staff, and
                start the new term with confidence.
              </p>

              <p className="text-sm font-semibold text-red-600 pt-4 flex items-center gap-2">
                <Zap size={18} className="flex-shrink-0" />
                This is a <strong>limited-time offer</strong> for schools
                joining SchoolBase now.
              </p>
            </div>

            {/* CTA Section */}
            <div className="mt-8 space-y-3">
              <Button
                href="/signup"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Get Started Today
              </Button>
              <p className="text-center text-sm text-gray-600">
                Questions? WhatsApp us on{' '}
                <a
                  href="https://wa.me/2349031368963"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  +234903 225 0338
                </a>
              </p>
            </div>

            {/* Footer hashtags */}
            <p className="mt-6 text-center text-xs text-gray-500">
              #SchoolBase #SchoolManagement #EdTech #Education #SchoolOwners
              #WestAfrica
            </p>
          </div>

          {/* Close note */}
          <div className="border-t border-gray-200 px-6 py-3 sm:px-8 text-center text-xs text-gray-500">
            This offer won't be available forever. Click close to dismiss.
          </div>
        </div>
      </div>
    </>
  );
}
