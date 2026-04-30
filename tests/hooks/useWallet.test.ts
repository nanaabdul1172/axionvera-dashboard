import React, { type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

import * as freighter from "@stellar/freighter-api";
import { useWallet, WalletProvider } from "@/hooks/useWallet";

jest.mock('@stellar/freighter-api', () => ({
  isConnected: jest.fn(async () => true),
  isAllowed: jest.fn(async () => true),
  setAllowed: jest.fn(async () => undefined),
  getPublicKey: jest.fn(async () => "GCONNECTEDPUBLICKEY"),
  getNetwork: jest.fn(async () => "TESTNET")
}));

describe('useWallet', () => {
  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(WalletProvider, null, children);
  }

  test('connect sets address', async () => {
import React, { type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

    await act(async () => {
      await result.current.connect("freighter");
    });

    await waitFor(() => expect(result.current.address).toBe("GCONNECTEDPUBLICKEY"));
    expect(result.current.isConnected).toBe(true);
  });

  test("connect defaults to freighter and sets address", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect("freighter");
    });

    await waitFor(() => expect(result.current.address).toBe("GCONNECTEDPUBLICKEY"));

    act(() => {
      result.current.disconnect();
    });

    await waitFor(() => expect(result.current.address).toBeNull());
    expect(result.current.isConnected).toBe(false);
    expect(localStorage.getItem("axionvera:wallet:was_connected")).toBeNull();
    expect(localStorage.getItem("axionvera:wallet:last_type")).toBeNull();
  });

  test("does not attempt silent reconnect without persisted flag", () => {
    renderHook(() => useWallet(), { wrapper });

    expect(mockedFreighter.isAllowed).not.toHaveBeenCalled();
    expect(mockedFreighter.getPublicKey).not.toHaveBeenCalled();
  });

  test("silently reconnects when persisted freighter session is present", async () => {
    localStorage.setItem("axionvera:wallet:was_connected", "true");
    localStorage.setItem("axionvera:wallet:last_type", "freighter");

    const { result } = renderHook(() => useWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.address).toBe("GCONNECTEDPUBLICKEY");
    });

    expect(mockedFreighter.isAllowed).toHaveBeenCalledTimes(1);
    expect(result.current.walletType).toBe("freighter");
  });

  test("exposes isNetworkMismatch when connected network differs from expected", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.network).toBe("testnet");
    expect(result.current.isNetworkMismatch).toBe(true);
  });
});
