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
      <section className="pt-16 pb-12 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-9 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center bg-white rounded-full px-3 py-1.5 shadow-sm mb-5">
                <Heart className="w-3.5 h-3.5 mr-1.5 fill-white text-black stroke-black stroke-2" />
                <span className="text-xs font-medium text-[#415052]">Notre histoire</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-[#2b2b2b] mb-5 leading-tight">
                Créé par des propriétaires,<br />
                <span className="text-[#7CAA89]">pour des propriétaires</span>
              </h1>

              <p className="text-sm text-[#415052] mb-5 leading-relaxed">
                Quittance Simple est née de la frustration de propriétaires face à la complexité
                et au coût des solutions existantes. Nous avons créé l'outil que nous aurions
                aimé avoir : simple, abordable et efficace.
              </p>

              <div className="bg-white rounded-2xl p-5 shadow-lg mb-6">
                <h3 className="text-xl font-bold text-[#2b2b2b] mb-3">Notre démarche</h3>
                <p className="text-sm text-[#415052] mb-3 leading-relaxed">
                  Nous croyons que la gestion locative ne devrait pas être une corvée. Trop de propriétaires
                  perdent du temps avec des outils complexes ou paient des frais exorbitants pour des
                  fonctionnalités qu'ils n'utilisent pas.
                </p>
                <p className="text-base text-[#415052] leading-relaxed">
                  C'est pourquoi nous avons créé Quittance Simple : une solution qui fait exactement ce dont
                  vous avez besoin, sans fioritures inutiles, à un prix juste.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
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
                      <div className="w-10 h-10 bg-[#7CAA89] rounded-xl flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xl font-bold text-[#2b2b2b] mb-0.5">{stat.number}</div>
                      <div className="text-xs text-[#415052]">{stat.label}</div>
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
              <div className="absolute -top-3 -right-3 w-14 h-14 bg-[#7CAA89] rounded-2xl flex items-center justify-center shadow-xl">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-3 -left-3 w-10 h-10 bg-[#ed7862] rounded-xl flex items-center justify-center shadow-xl">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-9">
            <h2 className="text-3xl font-bold text-[#2b2b2b] mb-3">
              Nos valeurs
            </h2>
            <p className="text-sm text-[#415052]">
              Les principes qui guident notre travail au quotidien
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="w-14 h-14 bg-[#ed7862] rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2b2b2b] mb-3">{value.title}</h3>
                  <p className="text-sm text-[#415052] leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-9 bg-[#fefdf9]">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <Coffee className="w-10 h-10 text-[#7CAA89] mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[#2b2b2b] mb-1.5">Simple et intuitif</h3>
              <p className="text-sm text-[#415052]">Une interface pensée pour être comprise en quelques secondes</p>
            </div>
            <div>
              <Users className="w-10 h-10 text-[#7CAA89] mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[#2b2b2b] mb-1.5">Support humain</h3>
              <p className="text-sm text-[#415052]">Une vraie équipe qui comprend vos besoins de propriétaire</p>
            </div>
            <div>
              <Heart className="w-10 h-10 mx-auto mb-3 fill-white text-[#7CAA89] stroke-[#7CAA89] stroke-2" />
              <h3 className="text-sm font-bold text-[#2b2b2b] mb-1.5">Tarifs honnêtes</h3>
              <p className="text-sm text-[#415052]">Des prix justes, sans surprise ni frais cachés</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#7CAA89]">
        <div className="max-w-4xl mx-auto px-5 text-center text-white">
          <div className="flex items-center justify-center mb-5">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-white"></div>
              ))}
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 text-white fill-current" />
                ))}
              </div>
            </div>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mb-5">
            Vous voulez gagner du temps et vous libérer des corvées administratives ?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            N'hésitez pas à essayer dès aujourd'hui nos solutions d'envoi automatique.
          </p>
          <Link
            to="/automation"
            className="inline-flex items-center bg-white text-[#7CAA89] px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
          >
            <Mail className="w-5 h-5 mr-2.5" />
            Automatiser mes quittances
            <ArrowRight className="w-5 h-5 ml-2.5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
