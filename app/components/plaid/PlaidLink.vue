<script setup lang="ts">
import request from "@/services/request";
import { ref, onMounted } from "vue";

// Configure the Plaid Link handler
// Declare Plaid as a global variable loaded from CDN
declare const Plaid: {
  create(config: {
    token: string;
    onSuccess: (
      public_token: string,
      metadata: PlaidLinkSuccessMetadata
    ) => void;
    onExit: (err: null | any, metadata: PlaidLinkOnExitMetadata) => void;
    onEvent: (eventName: string, metadata: PlaidLinkOnEventMetadata) => void;
    receivedRedirectUri?: string;
  }): {
    open: () => void;
    exit: () => void;
  };
};

// Define types for Plaid Link
interface PlaidLinkSuccessMetadata {
  institution: {
    name: string;
    institution_id: string;
  };
  accounts: Array<{
    id: string;
    name: string;
    mask: string;
    type: string;
    subtype: string;
  }>;
  link_session_id: string;
}

interface PlaidLinkOnExitMetadata {
  link_session_id: string;
  request_id: string;
  status: string;
  error?: {
    error_code: string;
    error_message: string;
    error_type: string;
  };
}

interface PlaidLinkOnEventMetadata {
  link_session_id: string;
  mfa_type?: string;
  request_id?: string;
  view_name?: string;
  error_code?: string;
  error_message?: string;
  error_type?: string;
  exit_status?: string;
  institution_id?: string;
  institution_name?: string;
  institution_search_query?: string;
}

const loading = ref(false);
const error = ref<string | null>(null);
const linkSuccess = ref(false);
const oauthRedirect = ref(false);

onMounted(() => {
  // Check if this is a redirect from the OAuth flow
  const queryParams = new URLSearchParams(window.location.search);
  const oauthState = queryParams.get('oauth_state_id');
  
  if (oauthState) {
    oauthRedirect.value = true;
    // Handle OAuth redirect - resume the Link flow
    beginLink(true);
  }
});

const beginLink = async (isOAuthRedirect = false) => {
  try {
    loading.value = true;
    error.value = null;

    // Build the redirect URI for OAuth flows
    const redirectUri = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;

    // Request link token from your server
    const { data } = await request.get("/plaid/link-token", {
      params: {
        redirect_uri: redirectUri // Pass the redirect URI to your server
      }
    });

    if (!data?.data?.link_token) {
      throw new Error("Failed to obtain link token");
    }

    const handler = Plaid.create({
      token: data.data.link_token,
      onSuccess: (public_token: string, metadata: PlaidLinkSuccessMetadata) => {
        onLinkSuccess(public_token, metadata);
      },
      onExit: (err: null | any, metadata: PlaidLinkOnExitMetadata) => {
        onExit(err, metadata);
      },
      onEvent: (eventName: string, metadata: PlaidLinkOnEventMetadata) => {
        onEvent(eventName, metadata);
      },
      // Use the same redirect URI for OAuth flows
      receivedRedirectUri: isOAuthRedirect ? window.location.href : undefined,
    });

    handler.open();
  } catch (err) {
    console.error("Error starting Plaid Link:", err);
    error.value =
      err instanceof Error ? err.message : "An unknown error occurred";
  } finally {
    loading.value = false;
  }
};

defineExpose({
  beginLink,
  loading,
  linkSuccess,
});

const onLinkSuccess = async (
  public_token: string,
  metadata: PlaidLinkSuccessMetadata
) => {
  try {
    loading.value = true;
    // Send the public token to your server to exchange for an access token
    await request.post("/plaid/new-connection", {
      public_token,
      metadata, // Include metadata for better tracking
    });
    linkSuccess.value = true;
  } catch (err) {
    console.error("Error in Plaid Link success handler:", err);
    error.value = "Failed to connect your account. Please try again.";
  } finally {
    loading.value = false;
  }
};

const onExit = (err: null | any, metadata: PlaidLinkOnExitMetadata) => {
  if (err) {
    console.error("Plaid Link error:", err, metadata);
    error.value =
      "There was an issue connecting to your bank. Please try again.";
  }
  loading.value = false;
};

const onEvent = (eventName: string, metadata: PlaidLinkOnEventMetadata) => {
  // Track events for analytics/debugging
  console.log(`Plaid Link Event: ${eventName}`, metadata);
};
</script>

<template>
  <!-- <div class="plaid-link-container">
    <div v-if="loading" class="loading-indicator">
      Connecting to your bank...
    </div>

    <div v-else-if="linkSuccess" class="success-message">
      Account successfully connected!
    </div>

    <div v-else>
      <button
        @click="() => beginLink()"
        :disabled="loading"
        class="plaid-connect-button"
      >
        Connect Your Bank Account
      </button>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div> -->
</template>

<style>
.plaid-link-container {
  padding: 16px;
  border-radius: 8px;
}

.plaid-connect-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.plaid-connect-button:hover {
  background-color: #0069d9;
}

.plaid-connect-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loading-indicator {
  padding: 10px;
  color: #666;
}

.success-message {
  color: #28a745;
  padding: 10px;
}

.error-message {
  color: #dc3545;
  margin-top: 10px;
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(220, 53, 69, 0.1);
}
</style>
