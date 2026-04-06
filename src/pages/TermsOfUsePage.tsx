import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfUsePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col px-4 pt-4 pb-6">
        <div className="relative mb-4 flex items-start justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 top-0 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#f7f7f8] text-[#111111]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            className="pt-[4px] text-center"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            <div className="text-[22px] font-bold tracking-[-0.03em] text-[#111111]">
              TERMS OF USE
            </div>

            <div className="mt-1 text-[12px] font-semibold tracking-[-0.01em] text-[#5f5f63]">
              Effective Date: 5-4-2026
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#ececf2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] overflow-hidden">
          <div
            className="h-[78vh] overflow-y-auto px-5 py-5 space-y-4 text-[15px] leading-7 text-[#3a3a3c]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">1. Acceptance of Terms</div>
              <p>
                By accessing or using ASK-GPT, you acknowledge that you have read, understood, and agreed
                to be bound by these Terms of Use. If you do not agree with any part of these terms, you
                must not access or use the service.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">2. Scope of Service</div>
              <p>
                ASK-GPT is an AI-powered application that may provide chat assistance, writing support,
                reasoning assistance, search-related features, voice-related tools, and other AI-supported
                functions. The service, features, supported providers, models, and limits may be updated,
                changed, restricted, suspended, or discontinued at any time.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">3. Eligibility and Acceptable Use</div>
              <p>
                You agree to use ASK-GPT only for lawful, proper, and authorized purposes. You must not use
                the service for unlawful activity, harmful conduct, abuse, fraud, spam, harassment,
                impersonation, unauthorized automation, or any activity that may harm the platform, its users,
                or third parties.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">4. Nature of AI Responses</div>
              <p>
                AI-generated responses may be incomplete, inaccurate, outdated, misleading, or otherwise
                unsuitable for your specific situation. ASK-GPT does not guarantee the correctness,
                completeness, reliability, legality, or suitability of any AI-generated output. You are solely
                responsible for reviewing and verifying important information before relying on it.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">5. Supported API Provider</div>
              <p>
                At this time, ASK-GPT officially supports only Groq API key usage for user-provided API
                access inside the app, unless ASK-GPT officially adds support for another provider in the
                future.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">6. User-Provided API Keys</div>
              <p>
                If you choose to use your own API key inside ASK-GPT, you remain solely responsible for that
                key, its security, its usage, and your compliance with the API provider&rsquo;s rules and
                restrictions. ASK-GPT does not assume responsibility for loss, exposure, restriction,
                suspension, misuse, invalidation, or provider-side enforcement relating to your key.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">
                7. Platform Limits and Provider Limits
              </div>
              <p>
                Using your own Groq API key inside ASK-GPT does not mean you automatically receive the full
                provider-side quota, full capacity, or unrestricted provider usage inside the ASK-GPT
                platform. ASK-GPT may apply its own internal app-level limits, message caps, access tiers,
                fairness controls, feature restrictions, routing rules, and usage distribution policies.
              </p>
              <p>
                These ASK-GPT platform limits are separate from the original limits, quota, or usage rights
                that may exist directly under your API provider account. As a result, the usage available to
                you inside ASK-GPT may be lower, different, or otherwise restricted compared to direct
                provider usage outside the platform.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">
                8. No Entitlement to Full Provider Capacity
              </div>
              <p>
                Use of your personal API key within ASK-GPT does not create any entitlement to unrestricted,
                full-capacity, provider-level access inside the ASK-GPT platform. ASK-GPT retains the right
                to define and enforce its own internal access rules, feature limits, and platform policies.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">
                9. Free Access, Limited Access, and Paid Access
              </div>
              <p>
                ASK-GPT may provide free access, ad-supported access, limited access, user-key-based access,
                or paid access depending on the feature, plan, system configuration, or internal platform
                rules. Feature availability, usage caps, model availability, and app-level limits may be
                changed, reduced, expanded, or removed at any time.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">
                10. Suspension, Restriction, and Enforcement
              </div>
              <p>
                ASK-GPT reserves the right to limit, block, suspend, or terminate access to any user,
                feature, API-related function, or session where misuse, abuse, harmful activity, suspicious
                behavior, policy violation, security risk, or platform abuse is detected or reasonably
                suspected.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">11. No Warranty</div>
              <p>
                ASK-GPT is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. No
                representation or warranty is made regarding uninterrupted availability, error-free operation,
                feature continuity, device compatibility, model continuity, provider continuity, or
                suitability for every use case.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">12. Limitation of Liability</div>
              <p>
                To the fullest extent permitted by applicable law, ASK-GPT, its creator, operator, developer,
                affiliates, and related parties shall not be liable for any direct, indirect, incidental,
                consequential, special, exemplary, punitive, or other damages arising out of or relating to
                your use of the service, your reliance on AI-generated output, API provider restrictions,
                user-provided key issues, interruptions, delays, errors, limitations, or unavailability of
                features.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">
                13. No Professional Relationship
              </div>
              <p>
                Use of ASK-GPT does not create any legal, medical, financial, employment, advisory,
                fiduciary, agency, partnership, or other professional relationship between you and ASK-GPT.
                No AI-generated output should be interpreted as creating any professional duty or obligation.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">14. Third-Party Services</div>
              <p>
                ASK-GPT may rely on, integrate with, or provide access to third-party services, providers,
                APIs, infrastructure, or tools. ASK-GPT is not responsible for the availability, conduct,
                restrictions, policies, security, pricing, failures, or terms of such third-party services.
                Your use of those services may also be subject to separate third-party terms.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">15. Changes to These Terms</div>
              <p>
                ASK-GPT may revise, update, replace, or modify these Terms of Use at any time. Continued use
                of the service after any such change becomes effective constitutes your acceptance of the
                updated terms.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[15px] font-semibold text-[#111111]">16. Contact</div>
              <p>
                If official contact or support details are provided inside the ASK-GPT platform, you may use
                those channels for questions relating to these Terms of Use.
              </p>
            </div>
          </div>
       </div>

        <div className="mt-auto pt-5 pb-1 text-center">
          <div
            className="text-[13px] font-medium tracking-[-0.02em] text-[#7c7c82]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
           Founder/Created by
          </div>

          <div
            className="mt-1 text-[14px] font-semibold tracking-[-0.02em] text-[#111111]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
            }}
          >
            ANIL GHOSH PROHOR
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUsePage;
