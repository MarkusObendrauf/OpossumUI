// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { Action } from '@reduxjs/toolkit';
import { noop } from 'lodash';
import { Component, Dispatch, ErrorInfo, ReactNode } from 'react';
import { connect } from 'react-redux';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { SendErrorInformationArgs } from '../../../shared/shared-types';
import { OpossumColors } from '../../shared-styles';
import { resetResourceState } from '../../state/actions/resource-actions/all-views-simple-actions';
import { resetViewState } from '../../state/actions/view-actions/view-actions';

const classes = {
  root: {
    background: OpossumColors.lightBlue,
    width: '100vw',
    height: '100vh',
  },
};

// catches errors that are not thrown during render
// it's known to fire twice in dev mode: https://github.com/facebook/react/issues/19613
window.addEventListener('error', (event): void => {
  if (event.error) {
    sendErrorInfo(event.error, {
      componentStack: event.error.stack,
    });
  }
});

interface ErrorBoundaryState {
  hasError: boolean;
}

interface DispatchProps {
  resetState(): void;
}

interface ErrorBoundaryProps extends DispatchProps {
  children: ReactNode;
}

function sendErrorInfo(error: Error, errorInfo: ErrorInfo): void {
  const sendErrorInformationArgs: SendErrorInformationArgs = {
    error,
    errorInfo,
  };
  window.electronAPI.sendErrorInformation(sendErrorInformationArgs);
}

class ProtoErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private removeListener: () => void = noop;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  override componentDidMount(): void {
    this.removeListener = window.electronAPI.on(
      AllowedFrontendChannels.RestoreFrontend,
      () => {
        this.props.resetState();
        this.setState({ hasError: false });
      },
    );
  }

  override componentWillUnmount(): void {
    this.removeListener();
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    sendErrorInfo(error, errorInfo);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return <MuiBox sx={classes.root} />;
    }

    return this.props.children;
  }
}

function mapDispatchToProps(dispatch: Dispatch<Action>): DispatchProps {
  return {
    resetState: (): void => {
      dispatch(resetResourceState());
      dispatch(resetViewState());
    },
  };
}

export const ErrorBoundary = connect(
  null,
  mapDispatchToProps,
)(ProtoErrorBoundary);
