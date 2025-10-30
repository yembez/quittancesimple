import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Target, Heart, Award, Mail, Star, Shield, Zap, Coffee, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const About = () => {
  const values = [
    {
      icon: Coffee,
      title: 'Simplicité',
      description: 'Nous croyons que la gestion locative doit être simple et accessible à tous les propriétaires.'
    },
    {
      icon: Heart,
      title: 'Transparence',
      description: 'Pas de frais cachés, pas de surprises. Nos tarifs sont clairs et nos fonctionnalités transparentes.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Nous nous efforçons de fournir le meilleur service possible avec une attention aux détails.'
    }
  ];

  const stats = [
    {
      icon: Users,
      number: '2 500+',
      label: 'Propriétaires'
    },
    {
      icon: Target,
      number: '10 000+',
      label: 'Quittances'
    },
    {
      icon: Star,
      number: '4.9/5',
      label: 'Satisfaction'
    },
    {
      icon: Shield,
      number: '100%',
      label: 'Sécurisé'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="pt-20 pb-16 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-sm mb-6">
                <Heart className="w-4 h-4 text-[#ed7862] mr-2 fill-current" />
                <span className="text-sm font-medium text-[#415052]">Notre histoire</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-[#415052] mb-6 leading-tight">
                Créé par des propriétaires,<br />
                <span className="text-[#79ae91]">pour des propriétaires</span>
              </h1>

              <p className="text-xl text-[#415052] mb-6 leading-relaxed">
                Quittance Simple est née de la frustration de propriétaires face à la complexité
                et au coût des solutions existantes. Nous avons créé l'outil que nous aurions
                aimé avoir : simple, abordable et efficace.
              </p>

              <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
                <h3 className="text-2xl font-bold text-[#415052] mb-4">Notre démarche</h3>
                <p className="text-lg text-[#415052] mb-4 leading-relaxed">
                  Nous croyons que la gestion locative ne devrait pas être une corvée. Trop de propriétaires
                  perdent du temps avec des outils complexes ou paient des frais exorbitants pour des
                  fonctionnalités qu'ils n'utilisent pas.
                </p>
                <p className="text-lg text-[#415052] leading-relaxed">
                  C'est pourquoi nous avons créé Quittance Simple : une solution qui fait exactement ce dont
                  vous avez besoin, sans fioritures inutiles, à un prix juste.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="text-center"
                    >
                      <div className="w-12 h-12 bg-[#79ae91] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-[#415052] mb-1">{stat.number}</div>
                      <div className="text-sm text-[#415052]">{stat.label}</div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://jfpbddtdblqakabyjxkq.supabase.co/storage/v1/object/public/website-images/couple_photo.jpg"
                  alt="Couple de propriétaires détendus"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#79ae91] rounded-2xl flex items-center justify-center shadow-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-[#ed7862] rounded-xl flex items-center justify-center shadow-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#415052] mb-4">
              Nos valeurs
            </h2>
            <p className="text-xl text-[#415052]">
              Les principes qui guident notre travail au quotidien
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="w-16 h-16 bg-[#ed7862] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#415052] mb-4">{value.title}</h3>
                  <p className="text-[#415052] leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Coffee className="w-12 h-12 text-[#79ae91] mx-auto mb-4" />
              <h3 className="font-bold text-[#415052] mb-2">Simple et intuitif</h3>
              <p className="text-[#415052]">Une interface pensée pour être comprise en quelques secondes</p>
            </div>
            <div>
              <Users className="w-12 h-12 text-[#79ae91] mx-auto mb-4" />
              <h3 className="font-bold text-[#415052] mb-2">Support humain</h3>
              <p className="text-[#415052]">Une vraie équipe qui comprend vos besoins de propriétaire</p>
            </div>
            <div>
              <Heart className="w-12 h-12 text-[#79ae91] mx-auto mb-4 fill-current" />
              <h3 className="font-bold text-[#415052] mb-2">Tarifs honnêtes</h3>
              <p className="text-[#415052]">Des prix justes, sans surprise ni frais cachés</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#79ae91]">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <div className="flex items-center justify-center mb-6">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-white/20 border-2 border-white"></div>
              ))}
            </div>
            <div className="ml-4">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 text-white fill-current" />
                ))}
              </div>
            </div>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Vous voulez gagner du temps et vous libérer des corvées administratives ?
          </h2>
          <p className="text-2xl mb-10 opacity-90">
            N'hésitez pas à essayer dès aujourd'hui nos solutions d'envoi automatique.
          </p>
          <Link
            to="/automation"
            className="inline-flex items-center bg-white text-[#79ae91] px-10 py-5 rounded-full font-bold text-xl shadow-xl hover:shadow-2xl transition-all"
          >
            <Mail className="w-6 h-6 mr-3" />
            Automatiser mes quittances
            <ArrowRight className="w-6 h-6 ml-3" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
