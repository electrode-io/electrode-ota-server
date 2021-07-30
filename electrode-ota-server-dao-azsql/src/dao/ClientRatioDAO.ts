import { IConnection } from "mysql";

import { ClientRatioDTO } from "../dto";

import { ClientRatioQueries, PackageQueries } from "../queries";

import BaseDAO from "./BaseDAO";

export default class ClientRatioDAO extends BaseDAO {
    public static async clientRatio(connection: IConnection, clientUniqueId: string,
                                    packageHash: string): Promise<ClientRatioDTO | undefined> {
        const pkgResults = await ClientRatioDAO.getPackageByHash(connection, packageHash);

        if (!pkgResults || pkgResults.length === 0) {
            return undefined;
        }

        const clientRatios = await ClientRatioDAO.getClientRatio(connection, clientUniqueId, pkgResults[0].id);

        if (clientRatios && clientRatios.length > 0) {
            const clientRatio = clientRatios[0];
            const dto = new ClientRatioDTO();
            dto.clientUniqueId = clientRatio.client_unique_id;
            dto.inserted = clientRatio.create_time;
            dto.packageHash = packageHash;
            dto.ratio = clientRatio.ratio;
            dto.updated = (clientRatio.is_updated === 1);
            return dto;
        } else {
            return undefined;
        }
    }

    public static async insertClientRatio(connection: IConnection, clientUniqueId: string, packageHash: string,
                                          ratio: number, updated: boolean): Promise<void> {

        const pkgResults = await ClientRatioDAO.getPackageByHash(connection, packageHash);

        if (!pkgResults || pkgResults.length === 0) {
            throw new Error("Not found. package not found for package hash [" + packageHash + "]");
        }
        const pkgId = pkgResults[0].id;

        const updateResults = await ClientRatioDAO.updateClientRatio(connection, clientUniqueId, pkgId, ratio, updated);
        if (updateResults.affectedRows === 0) {
            ClientRatioDAO.insertClientRatioDB(connection, clientUniqueId, pkgId, ratio, updated);
        }
    }

    private static async getPackageByHash(connection: IConnection, packageHash: string): Promise<any> {
        return ClientRatioDAO.query(connection, PackageQueries.getPackageByHash, [packageHash]);
    }

    private static async getClientRatio(connection: IConnection, clientUniqueId: string, pkgId: number): Promise<any> {
        return ClientRatioDAO.query(connection, ClientRatioQueries.getClientRatioByClientId, [clientUniqueId, pkgId]);
    }

    private static async updateClientRatio(connection: IConnection, clientUniqueId: string,
                                           pkgId: number, ratio: number, updated: boolean): Promise<any> {
        return ClientRatioDAO.query(connection, ClientRatioQueries.updateClientRatio,
            [ratio, updated, clientUniqueId, pkgId]);
    }

    // tslint:disable-next-line:adjacent-overload-signatures
    private static async insertClientRatioDB(connection: IConnection, clientUniqueId: string,
                                             pkgId: number, ratio: number, updated: boolean): Promise<any> {
        return ClientRatioDAO.query(connection, ClientRatioQueries.insertClientRatio,
            [clientUniqueId, pkgId, ratio, updated]);
    }
}
