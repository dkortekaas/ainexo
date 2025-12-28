"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Card, Badge, SaveButton, Input, Label } from "@/components/ui";
import {
  RefreshCw,
  CreditCard,
  AlertCircle,
  CheckCircle,
  FileText,
  Download,
  Eye,
  Building2,
  Edit,
  X,
  Check,
} from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptionPlans";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { safeRedirect } from "@/lib/safe-redirect";

interface BillingData {
  user: {
    id: string;
    email: string;
    name: string | null;
    subscriptionStatus: string;
    subscriptionPlan: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    trialStartDate: string | null;
    trialEndDate: string | null;
    subscriptionStartDate: string | null;
    subscriptionEndDate: string | null;
    subscriptionCancelAt: string | null;
    subscriptionCanceled: boolean;
    isTrialActive: boolean;
    trialDaysRemaining: number;
    currentPlan: any;
    gracePeriod: any;
  };
  company: {
    id: string;
    name: string;
    billingName: string | null;
    billingEmail: string | null;
    vatNumber: string | null;
    billingAddress: any;
  } | null;
  invoices: Array<{
    id: string;
    number: string | null;
    status: string;
    amount: number;
    currency: string;
    created: string;
    dueDate: string | null;
    paidAt: string | null;
    invoicePdf: string | null;
    hostedInvoiceUrl: string | null;
  }>;
  paymentMethods: Array<{
    id: string;
    type: string;
    card: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    } | null;
  }>;
}

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [managing, setManaging] = useState(false);
  const [editingBilling, setEditingBilling] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const t = useTranslations();

  const [billingForm, setBillingForm] = useState({
    billingName: "",
    billingEmail: "",
    vatNumber: "",
    street: "",
    city: "",
    zip: "",
    state: "",
    country: "",
  });

  const fetchBillingData = useCallback(async () => {
    try {
      const response = await fetch("/api/billing");
      if (response.ok) {
        const data = await response.json();
        setBillingData(data);

        // Initialize billing form
        if (data.company) {
          const address = data.company.billingAddress || {};
          setBillingForm({
            billingName: data.company.billingName || data.company.name || "",
            billingEmail: data.company.billingEmail || data.user?.email || "",
            vatNumber: data.company.vatNumber || "",
            street: address.street || "",
            city: address.city || "",
            zip: address.zip || "",
            state: address.state || "",
            country: address.country || "",
          });
        }
      } else {
        toast({
          title: "Error",
          description: t("billing.failedToFetchBillingData"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
      toast({
        title: "Error",
        description: t("billing.failedToFetchBillingData"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(true);
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        const { url } = await response.json();
        toast({
          title: "Redirecting",
          description: "Taking you to checkout...",
        });
        safeRedirect(url);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || t("billing.failedToCreateSubscription"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: "Error",
        description: t("billing.failedToCreateSubscription"),
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManaging(true);
    try {
      const response = await fetch("/api/subscriptions/manage");

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          toast({
            title: "Redirecting",
            description: "Opening billing portal...",
          });
          safeRedirect(data.url);
        } else {
          toast({
            title: "Error",
            description: "No portal URL received",
            variant: "destructive",
          });
        }
      } else {
        const errorData = await response.json();
        console.error("Manage subscription error:", {
          status: response.status,
          error: errorData,
        });

        if (
          response.status === 404 &&
          errorData.error === "No subscription found"
        ) {
          toast({
            title: t("billing.noSubscription"),
            description: t("billing.noSubscriptionDescription"),
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: errorData.error || t("billing.failedToOpenPortal"),
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error managing subscription:", error);
      toast({
        title: "Error",
        description: t("billing.failedToOpenPortal"),
        variant: "destructive",
      });
    } finally {
      setManaging(false);
    }
  };

  const handleSaveBillingDetails = async () => {
    setSavingBilling(true);
    try {
      const response = await fetch("/api/billing", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billingName: billingForm.billingName,
          billingEmail: billingForm.billingEmail,
          vatNumber: billingForm.vatNumber,
          billingAddress: {
            street: billingForm.street,
            city: billingForm.city,
            zip: billingForm.zip,
            state: billingForm.state,
            country: billingForm.country,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: t("common.success"),
          description: t("billing.billingDetailsSaved"),
        });
        setEditingBilling(false);
        fetchBillingData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || t("billing.failedToSaveBillingDetails"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving billing details:", error);
      toast({
        title: "Error",
        description: t("billing.failedToSaveBillingDetails"),
        variant: "destructive",
      });
    } finally {
      setSavingBilling(false);
    }
  };

  const handleSyncSubscription = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/billing/sync", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: t("common.success"),
          description: t("billing.subscriptionSynced"),
        });
        // Refresh billing data
        await fetchBillingData();
      } else {
        const error = await response.json();
        // Show a more user-friendly message for trial users
        const errorMessage =
          error.error?.includes("Trial users") ||
          error.error?.includes("paid subscriptions")
            ? t("billing.syncOnlyForPaidPlans")
            : error.error || t("billing.failedToSyncSubscription");
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error syncing subscription:", error);
      toast({
        title: "Error",
        description: t("billing.failedToSyncSubscription"),
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">{t("common.statuses.loading")}</span>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{t("billing.failedToLoadBillingData")}</p>
      </div>
    );
  }

  const { user } = billingData;
  const isTrial = user.subscriptionStatus === "TRIAL";
  const isActive = user.subscriptionStatus === "ACTIVE";
  const isExpired = isTrial ? !user.isTrialActive : false;
  const isEffectivelyActive =
    (isTrial && !isExpired) || (isActive && !isExpired);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {t("billing.title")}
          </h1>
        </div>
        {!(isTrial && !user.stripeCustomerId) && (
          <Button
            onClick={handleSyncSubscription}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-indigo-50 w-full md:w-auto"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? t("billing.syncing") : t("billing.syncSubscription")}
          </Button>
        )}
      </div>

      {/* Trial Status Alert */}
      {isTrial && (
        <Card
          className={`p-4 ${isExpired ? "border-red-200 bg-red-50" : "border-blue-200 bg-indigo-50"}`}
        >
          <div className="flex items-center space-x-3">
            {isExpired ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-primary" />
            )}
            <div>
              <h3
                className={`font-medium ${isExpired ? "text-red-800" : "text-blue-800"}`}
              >
                {isExpired
                  ? t("billing.trialExpired")
                  : t("billing.trialActive")}
              </h3>
              <p
                className={`text-sm ${isExpired ? "text-red-600" : "text-blue-600"}`}
              >
                {isExpired
                  ? t("billing.trialExpiredDescription")
                  : t("billing.trialActiveDescription", {
                      days: user.trialDaysRemaining,
                    })}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("billing.currentPlan")}
              </h3>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900">
                {isTrial
                  ? t("billing.trialPeriod")
                  : user.currentPlan?.name || t("billing.noPlan")}
              </h4>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  className={`${
                    isTrial
                      ? "bg-blue-100 text-blue-800"
                      : isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isTrial ? t("billing.trial") : user.subscriptionStatus}
                </Badge>
                {user.subscriptionCanceled && (
                  <Badge className="bg-orange-100 text-orange-800">
                    {t("billing.canceled")}
                  </Badge>
                )}
              </div>
            </div>

            {user.currentPlan && (
              <div className="pt-4 border-t">
                <h5 className="font-medium text-gray-900 mb-2">
                  {t("billing.planDetails")}
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("billing.price")}:</span>
                    <span className="font-medium">
                      €{user.currentPlan.price}/{t("common.month")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("billing.assistants")}:
                    </span>
                    <span className="font-medium">
                      {user.currentPlan.limits?.assistants === -1
                        ? t("billing.unlimited")
                        : user.currentPlan.limits?.assistants || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("billing.conversationsPerMonth")}:
                    </span>
                    <span className="font-medium">
                      {user.currentPlan.limits?.conversationsPerMonth === -1
                        ? t("billing.unlimited")
                        : user.currentPlan.limits?.conversationsPerMonth || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              {isActive && (
                <Button
                  onClick={handleManageSubscription}
                  disabled={managing}
                  variant="outline"
                  className="border-primary text-primary hover:bg-indigo-50"
                >
                  {managing
                    ? t("common.statuses.loading")
                    : t("billing.manageSubscription")}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Available Plans Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("billing.availablePlans")}
              </h3>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                    <span className="text-lg font-bold text-primary">
                      €{plan.price}/{t("common.month")}
                    </span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-3">
                    {plan.features.slice(0, 2).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleUpgrade(key)}
                    disabled={
                      upgrading ||
                      (!isExpired &&
                        !isTrial &&
                        user.subscriptionPlan === key) ||
                      (!isExpired && isTrial && key === "TRIAL")
                    }
                    className="w-full bg-primary hover:bg-primary/80 text-white"
                    size="sm"
                  >
                    {upgrading
                      ? t("common.statuses.loading")
                      : !isExpired && !isTrial && user.subscriptionPlan === key
                        ? t("billing.currentPlan")
                        : !isExpired && isTrial && key === "TRIAL"
                          ? t("billing.active")
                          : t("billing.upgrade")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Invoices Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                <FileText className="w-5 h-5 inline mr-2" />
                {t("billing.invoices")}
              </h3>
            </div>

            {billingData.invoices.length === 0 ? (
              <p className="text-sm text-gray-600">{t("billing.noInvoices")}</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {billingData.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="border rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {invoice.number || invoice.id}
                        </span>
                        <Badge
                          className={`text-xs ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : invoice.status === "open"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {new Date(invoice.created).toLocaleDateString("nl-NL")}{" "}
                        • €{(invoice.amount / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {invoice.hostedInvoiceUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(invoice.hostedInvoiceUrl!, "_blank")
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {invoice.invoicePdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(invoice.invoicePdf!, "_blank")
                          }
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Payment Method Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                <CreditCard className="w-5 h-5 inline mr-2" />
                {t("billing.paymentMethod")}
              </h3>
            </div>

            {billingData.paymentMethods.length === 0 ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  {t("billing.noPaymentMethod")}
                </p>
                {user.stripeCustomerId && (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={managing}
                    variant="outline"
                    className="border-primary text-primary hover:bg-indigo-50"
                  >
                    {managing
                      ? t("common.statuses.loading")
                      : t("billing.addPaymentMethod")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {billingData.paymentMethods.map((pm) => (
                  <div key={pm.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {pm.card?.brand} •••• {pm.card?.last4}
                          </p>
                          <p className="text-xs text-gray-600">
                            {t("billing.expires")}: {pm.card?.expMonth}/
                            {pm.card?.expYear}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={handleManageSubscription}
                  disabled={managing}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {managing
                    ? t("common.statuses.loading")
                    : t("billing.updatePaymentMethod")}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Billing Details Card */}
        <Card className="p-6 lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                <Building2 className="w-5 h-5 inline mr-2" />
                {t("billing.billingDetails")}
              </h3>
              {!editingBilling && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingBilling(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t("common.edit")}
                </Button>
              )}
            </div>

            {/* Alert if billing details are incomplete */}
            {!editingBilling &&
              (!billingData.company?.billingName ||
                !billingData.company?.billingEmail ||
                !billingData.company?.billingAddress?.street) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 font-medium">
                      {t("billing.incompleteDetails")}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      {t("billing.incompleteDetailsDescription")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingBilling(true)}
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                  >
                    {t("billing.completeNow")}
                  </Button>
                </div>
              )}

            {editingBilling ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingName">
                      {t("billing.companyName")}
                    </Label>
                    <Input
                      id="billingName"
                      value={billingForm.billingName}
                      onChange={(e) =>
                        setBillingForm({
                          ...billingForm,
                          billingName: e.target.value,
                        })
                      }
                      placeholder={t("billing.companyNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingEmail">
                      {t("billing.billingEmail")}
                    </Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      value={billingForm.billingEmail}
                      onChange={(e) =>
                        setBillingForm({
                          ...billingForm,
                          billingEmail: e.target.value,
                        })
                      }
                      placeholder={t("billing.billingEmailPlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vatNumber">{t("billing.vatNumber")}</Label>
                    <Input
                      id="vatNumber"
                      value={billingForm.vatNumber}
                      onChange={(e) =>
                        setBillingForm({
                          ...billingForm,
                          vatNumber: e.target.value,
                        })
                      }
                      placeholder={t("billing.vatNumberPlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="street">{t("billing.street")}</Label>
                    <Input
                      id="street"
                      value={billingForm.street}
                      onChange={(e) =>
                        setBillingForm({
                          ...billingForm,
                          street: e.target.value,
                        })
                      }
                      placeholder={t("billing.streetPlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">{t("billing.city")}</Label>
                    <Input
                      id="city"
                      value={billingForm.city}
                      onChange={(e) =>
                        setBillingForm({
                          ...billingForm,
                          city: e.target.value,
                        })
                      }
                      placeholder={t("billing.cityPlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">{t("billing.zip")}</Label>
                    <Input
                      id="zip"
                      value={billingForm.zip}
                      onChange={(e) =>
                        setBillingForm({
                          ...billingForm,
                          zip: e.target.value,
                        })
                      }
                      placeholder={t("billing.zipPlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">{t("billing.state")}</Label>
                    <Input
                      id="state"
                      value={billingForm.state}
                      onChange={(e) =>
                        setBillingForm({
                          ...billingForm,
                          state: e.target.value,
                        })
                      }
                      placeholder={t("billing.statePlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">{t("billing.country")}</Label>
                    <Input
                      id="country"
                      value={billingForm.country}
                      onChange={(e) =>
                        setBillingForm({
                          ...billingForm,
                          country: e.target.value,
                        })
                      }
                      placeholder={t("billing.countryPlaceholder")}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <SaveButton
                    onClick={handleSaveBillingDetails}
                    disabled={savingBilling}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {savingBilling
                      ? t("common.statuses.saving")
                      : t("common.save")}
                  </SaveButton>
                  <Button
                    variant="outline"
                    onClick={() => setEditingBilling(false)}
                    disabled={savingBilling}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">
                    {t("billing.companyName")}:
                  </span>
                  <p className="font-medium">
                    {billingData.company?.billingName ||
                      billingData.company?.name ||
                      "-"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("billing.billingEmail")}:
                  </span>
                  <p className="font-medium">
                    {billingData.company?.billingEmail || user.email || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("billing.vatNumber")}:
                  </span>
                  <p className="font-medium">
                    {billingData.company?.vatNumber || "-"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-600">{t("billing.address")}:</span>
                  <p className="font-medium">
                    {billingData.company?.billingAddress ? (
                      <>
                        {billingData.company.billingAddress.street}
                        <br />
                        {billingData.company.billingAddress.zip}{" "}
                        {billingData.company.billingAddress.city}
                        {billingData.company.billingAddress.state && (
                          <>, {billingData.company.billingAddress.state}</>
                        )}
                        <br />
                        {billingData.company.billingAddress.country}
                      </>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
