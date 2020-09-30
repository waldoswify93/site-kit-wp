/**
 * modules/adsense data store: alerts tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { STORE_NAME } from './constants';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/adsense alerts', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {

	} );

	describe( 'selectors', () => {
		describe( 'getAlerts', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/alerts/,
					{ body: fixtures.alerts, status: 200 }
				);

				const accountID = fixtures.accounts[ 0 ].id;

				const initialAlerts = registry.select( STORE_NAME ).getAlerts( accountID );

				expect( initialAlerts ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getAlerts( accountID ) !== undefined
					),
				);

				const alerts = registry.select( STORE_NAME ).getAlerts( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( alerts ).toEqual( fixtures.alerts );
			} );

			it( 'does not make a network request if alerts for this account are already present', async () => {
				const accountID = fixtures.accounts[ 0 ].id;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry.dispatch( STORE_NAME ).receiveGetAlerts( fixtures.alerts, { accountID } );

				const alerts = registry.select( STORE_NAME ).getAlerts( accountID );

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getAlerts', [ accountID ] )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( alerts ).toEqual( fixtures.alerts );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.get(
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/alerts/,
					{ body: response, status: 500 }
				);

				const fakeAccountID = 'pub-777888999';
				registry.select( STORE_NAME ).getAlerts( fakeAccountID );
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).isFetchingGetAlerts( fakeAccountID ) === false,
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const alerts = registry.select( STORE_NAME ).getAlerts( fakeAccountID );
				expect( alerts ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
