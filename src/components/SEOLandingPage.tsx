import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import SEOHead from './SEOHead';

export interface HowItWorksSection {
  title: string;
  content: React.ReactNode;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface SEOLandingPageProps {
  metaTitle: string;
  metaDescription: string;
  keywords?: string;
  canonical: string;
  h1: string;
  intro: React.ReactNode;
  visualTitle?: string;
  visualContent?: React.ReactNode;
  howItWorksTitle?: string;
  howItWorks: HowItWorksSection[];
  faqTitle?: string;
  faq: FAQItem[];
  schema?: object;
}

const CTA_LINK = '/generator';
const CTA_TEXT = 'Générer ma quittance gratuite';

const SEOLandingPage: React.FC<SEOLandingPageProps> = ({
  metaTitle,
  metaDescription,
  keywords,
  canonical,
  h1,
  intro,
  visualTitle = 'À quoi ressemble une quittance de loyer ?',
  visualContent,
  howItWorksTitle = 'Comment ça marche ?',
  howItWorks,
  faqTitle = 'Questions fréquentes',
  faq,
  schema,
}) => {
  const defaultSchema = schema || {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: h1,
    description: metaDescription,
    author: { '@type': 'Organization', name: 'Quittance Simple' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        keywords={keywords}
        canonical={canonical}
        schema={defaultSchema}
      />

      <section className="pt-12 sm:pt-16 pb-8 sm:pb-12 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {h1}
            </h1>
            <div className="text-gray-600 leading-relaxed space-y-3 mb-8">
              {intro}
            </div>
            <Link
              to={CTA_LINK}
              className="inline-flex items-center bg-[#E65F3F] hover:bg-[#d95530] text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-colors text-sm"
            >
              {CTA_TEXT}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {visualContent !== undefined && (
        <section className="py-10 sm:py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              {visualTitle}
            </h2>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {visualContent}
            </div>
          </div>
        </section>
      )}

      <section className="py-10 sm:py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            {howItWorksTitle}
          </h2>
          <div className="space-y-6">
            {howItWorks.map((section, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
                <div className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              to={CTA_LINK}
              className="inline-flex items-center bg-[#E65F3F] hover:bg-[#d95530] text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-colors text-sm"
            >
              {CTA_TEXT}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            {faqTitle}
          </h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none px-5 py-4 font-medium text-gray-900 hover:bg-gray-50">
                  <span>{item.q}</span>
                  <ChevronDown className="w-5 h-5 text-gray-500 shrink-0 ml-2 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-4 pt-0 text-gray-600 leading-relaxed text-sm border-t border-gray-100">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SEOLandingPage;
