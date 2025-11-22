"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, User, Send } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ici, vous pouvez ajouter l'appel API pour envoyer le formulaire
      // Pour l'instant, on simule juste l'envoi
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Message envoyé avec succès !");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-20 bg-[#F8F5F0]"
    >
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2
            className="text-4xl font-bold text-[#2F2A25] mb-4"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            }}
          >
            Contactez-moi
          </h2>
          <p
            className="text-lg text-[#2F2A25]/80"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            }}
          >
            N'hésitez pas à me contacter pour toute question ou demande de rendez-vous
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 shadow-lg border border-[#E6D9C6]"
        >
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="firstName" className="text-[#2F2A25] mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-[#C6A664]" />
                Prénom *
              </Label>
              <Input
                id="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="bg-[#F8F5F0] border-[#E6D9C6] text-[#2F2A25] focus:border-[#C6A664]"
                placeholder="Votre prénom"
              />
            </div>

            <div>
              <Label htmlFor="lastName" className="text-[#2F2A25] mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-[#C6A664]" />
                Nom *
              </Label>
              <Input
                id="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="bg-[#F8F5F0] border-[#E6D9C6] text-[#2F2A25] focus:border-[#C6A664]"
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="email" className="text-[#2F2A25] mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#C6A664]" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-[#F8F5F0] border-[#E6D9C6] text-[#2F2A25] focus:border-[#C6A664]"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-[#2F2A25] mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#C6A664]" />
                Téléphone *
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-[#F8F5F0] border-[#E6D9C6] text-[#2F2A25] focus:border-[#C6A664]"
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          <div className="mb-6">
            <Label htmlFor="message" className="text-[#2F2A25] mb-2">
              Message
            </Label>
            <Textarea
              id="message"
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="bg-[#F8F5F0] border-[#E6D9C6] text-[#2F2A25] focus:border-[#C6A664]"
              placeholder="Votre message..."
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C6A664] hover:bg-[#B88A44] text-white rounded-full px-8 py-6 text-lg"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            }}
          >
            {loading ? (
              "Envoi en cours..."
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Envoyer le message
              </>
            )}
          </Button>
        </motion.form>
      </div>
    </motion.section>
  );
}

