"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import API_ROUTES from "../api/urls";
import { useMutationApi } from "../api/useMutation";
import useQueryApi from "../api/useQuery";
import { Canvas } from "@/src/types/common";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { selectCanvasId, updateCanvas } from "../redux/canvasSlice";

const hasWindow = typeof window !== "undefined";

const getStoredCanvasId = (): number | null => {
    if (!hasWindow) {
        return null;
    }

    const stored = window.localStorage.getItem("canvasId");
    if (!stored) return null;
    const parsed = Number(stored);
    return Number.isNaN(parsed) ? null : parsed;
};

export const useCanvas = () => {
    const { data, refetch, isLoading: isQueryLoading } = useQueryApi<{ canvases: Canvas[] }>(
        API_ROUTES.CANVASES_LIST,
        {
            queryKey: ["canvases"],
            hasToken: true,
        }
    );

    const dispatch = useAppDispatch();
    const canvasId = useAppSelector(selectCanvasId);
    const canvas = canvasId ?? null;

    const { mutateAsync, isPending } = useMutationApi(API_ROUTES.CANVASES_CREATE, {
        method: "post",
        successKey: "success.canvas.created",
        hasToken: true,
    });

    const queryClient = useQueryClient();

    const selectCanvas = useCallback((nextCanvasId: number) => {
        dispatch(updateCanvas(nextCanvasId));
        if (hasWindow) {
            window.localStorage.setItem("canvasId", nextCanvasId.toString());
        }
        queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] !== "canvases",
        });
    }, [dispatch, queryClient]);

    const createCanvas = async (name: string, description: string, canvasType: string, photoUrl: string, baseCurrencyId: number) => {
        const response = await mutateAsync({
            name,
            description: description || undefined,
            canvasType,
            photoUrl,
            baseCurrencyId,
        });
        const newCanvasId = (response as { canvas?: { id: number } })?.canvas?.id;
        if (typeof newCanvasId === "number") {
            selectCanvas(newCanvasId);
        }
        await refetch();
    };

    useEffect(() => {
        if (canvasId !== undefined) return;

        const stored = getStoredCanvasId();
        if (stored !== null) {
            dispatch(updateCanvas(stored));
            return;
        }

        const firstId = data?.canvases?.[0]?.id;
        if (typeof firstId === "number") {
            selectCanvas(firstId);
        }
    }, [canvasId, data?.canvases, dispatch, selectCanvas]);

    return {
        canvases: data?.canvases ?? [],
        canvas,
        activeCanvas: (data?.canvases ?? []).find((c) => c.id === canvas) ?? null,
        selectCanvas,
        createCanvas,
        isQueryLoading, 
        isCreating: isPending, 
        refetch
    };
};
