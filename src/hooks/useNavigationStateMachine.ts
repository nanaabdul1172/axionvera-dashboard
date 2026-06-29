import { useMemo } from "react";
import { useRouter } from "next/router";
import { useRBAC } from "@/contexts/RBACContext";
import {
  deriveNavigationState,
  NavigationContext,
  NavigationState,
  validateNavigationTransition,
} from "@/navigation/stateMachine";

export function useNavigationStateMachine(previousState: NavigationState = "public") {
  const router = useRouter();
  const { user, isAuthenticated } = useRBAC();

  const context = useMemo<NavigationContext>(
    () => ({ pathname: router.pathname, user, isAuthenticated }),
    [router.pathname, user, isAuthenticated],
  );

  const state = useMemo(() => deriveNavigationState(context), [context]);
  const transition = useMemo(
    () => validateNavigationTransition(previousState, context),
    [previousState, context],
  );

  return { state, transition, context };
}
